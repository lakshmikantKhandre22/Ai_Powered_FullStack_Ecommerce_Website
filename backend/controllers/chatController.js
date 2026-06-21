import jwt from 'jsonwebtoken';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';
import chatCache from '../utils/cacheUtil.js';
import { Category, Chat } from '../db/dbClient.js';

import intentService from '../services/intentService.js';
import contextService from '../services/contextService.js';
import retrievalService from '../services/retrievalService.js';
import recommendationService from '../services/recommendationService.js';
import promptBuilder from '../prompts/promptBuilder.js';

// Helper: Hash function or key builder for the query caching
const buildCacheKey = (userId, message, history) => {
  const historyKey = history.map(h => `${h.role}:${h.text.slice(0, 30)}`).join('|');
  return `chat:${userId || 'anon'}:${message.trim().toLowerCase()}:${historyKey}`;
};

// @desc    Intelligent Shopping Assistant Coordinator
// @route   POST /api/chat
// @access  Public
export const handleChat = catchAsync(async (req, res, next) => {
  const { message, history } = req.body;

  if (!message) {
    return next(new CustomError('Please provide a message!', 400));
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return next(new CustomError('Gemini API key is not configured in backend .env', 500));
  }

  // 1. Resolve User Session Authentication details
  let userId = null;
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Proceed as anonymous user if verification fails
    }
  }

  // 2. Fetch Category List dynamically for spelling resolution context
  let categoryNames = [];
  try {
    const categories = await Category.find({}, 'name');
    categoryNames = categories.map(c => c.name);
  } catch (err) {
    console.warn('Failed to pre-fetch category names context:', err);
  }

  // 3. SECURE SESSION ISOLATION: Retrieve/format history from DB (if logged in) or request payload (if guest)
  let formattedHistory = [];
  if (userId) {
    try {
      let chatSession = await Chat.findOne({ userId });
      if (!chatSession) {
        chatSession = await Chat.create({ userId, messages: [] });
      }
      formattedHistory = contextService.formatHistory(chatSession.messages);
    } catch (err) {
      console.error('Failed to load chat history from MongoDB:', err);
      formattedHistory = contextService.formatHistory(history || []);
    }
  } else {
    formattedHistory = contextService.formatHistory(history || []);
  }

  // 4. Performance: Check response cache for duplicate prompts
  const cacheKey = buildCacheKey(userId, message, formattedHistory);
  const cachedResponse = chatCache.get(cacheKey);
  if (cachedResponse) {
    console.log('[ShopSphere Cache] Serving cached chat response...');
    return res.status(200).json(cachedResponse);
  }

  // 5. Run universal Intent Detection & Entity Filter Extraction
  const { intent, filters } = await intentService.detectIntentAndFilters(
    message,
    formattedHistory,
    categoryNames
  );

  console.log(`[ShopSphere AI] Intent: "${intent.intent}" (Confidence: ${intent.confidence})`);
  console.log('[ShopSphere AI] Extracted Filters:', JSON.stringify(filters));

  // Determine if query is shopping related (FAQ, Greetings, Unrelated, Customer Support are handled without DB search)
  const isShopping = ![ 'unrelated', 'greetings', 'faq', 'customer_support' ].includes(intent.intent);

  const productSeekingIntents = [
    'search_products',
    'recommend_products',
    'explain_product',
    'product_details',
    'find_alternatives',
    'compatibility_check',
    'budget_planning',
    'feature_based_selection',
    'availability_check',
    'category_exploration'
  ];

  let finalProducts = [];
  const extraContext = {
    orders: [],
    reviews: [],
    preference: null
  };

  // 6. DB-First Retrieval layer
  if (isShopping) {
    // Reconstruct/merge previous filters from history if follow-up query is detected
    let activeFilters = filters;
    if (intent.intent === 'follow_up' || formattedHistory.length > 0) {
      const reconstructedPrevFilters = contextService.reconstructFiltersFromHistory(formattedHistory);
      activeFilters = contextService.mergeFilters(reconstructedPrevFilters, filters, intent.intent);
    }

    // Dynamic routing to specific DB queries based on intent
    if (intent.intent === 'order_help' || intent.intent === 'tracking') {
      extraContext.orders = await retrievalService.retrieveUserOrders(userId);
    } else if (intent.intent === 'review_summary') {
      const pName = activeFilters.product_name || activeFilters.keywords[0] || message;
      extraContext.reviews = await retrievalService.retrieveReviews(pName);
    } else if (intent.intent === 'compare_products') {
      const compareList = activeFilters.compare_items && activeFilters.compare_items.length > 0
        ? activeFilters.compare_items
        : activeFilters.keywords;
      const compareProducts = await retrievalService.retrieveComparisonProducts(compareList);
      finalProducts = recommendationService.rankProducts(compareProducts, activeFilters, null);
    } else if (productSeekingIntents.includes(intent.intent)) {
      // Standard search / recommendation query
      let retrievedProducts = await retrievalService.retrieveProducts(activeFilters);
      
      // Fetch personalization profile if logged in
      let personalPref = null;
      if (userId) {
        const personalData = await retrievalService.retrievePersonalizedProducts(userId);
        if (personalData && personalData.products.length > 0) {
          retrievedProducts = [ ...retrievedProducts, ...personalData.products ];
          personalPref = personalData.preference;
          extraContext.preference = personalPref;
        }
      }

      // Rerank and score candidates
      const ranked = recommendationService.rankProducts(retrievedProducts, activeFilters, personalPref);
      
      // Budget Optimizer: if total budget constraint exists, filter/optimize
      if (activeFilters.budget) {
        finalProducts = recommendationService.optimizeBudget(ranked, activeFilters.budget);
      } else {
        finalProducts = ranked.slice(0, 8); // top 8 recommendations
      }
    }
  }

  // 7. Prompt Generation and Gemini final response generation
  const systemPrompt = promptBuilder.buildSystemPrompt(intent.intent, finalProducts, extraContext, isShopping);

  const finalMessages = [
    ...formattedHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  let replyText = "Sorry, I couldn't find matching products from our catalog.";
  let suggestionsList = [
    'Show top rated products',
    'Explain return policies',
    'Laptops under ₹40,000'
  ];

  try {
    const finalResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: finalMessages,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      const outputRaw = finalData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (outputRaw) {
        const parsed = JSON.parse(outputRaw.trim());
        replyText = parsed.reply || replyText;
        suggestionsList = parsed.suggestions || suggestionsList;
      }
    } else {
      const errText = await finalResponse.text();
      console.error('Final Response Generation failed:', errText);
    }
  } catch (err) {
    console.error('Gemini content generation error:', err);
  }

  // 8. PERSIST CONTEXT SECURELY: Append messages to user's log in database
  if (userId) {
    try {
      await Chat.findOneAndUpdate(
        { userId },
        {
          $push: {
            messages: [
              { role: 'user', text: message },
              { role: 'model', text: replyText }
            ]
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('Failed to append chat messages to MongoDB:', err);
    }
  }

  // Format client product details correctly for frontend rendering
  const formattedClientProducts = finalProducts.map(p => ({
    _id: p._id,
    title: p.title,
    brand: p.brand,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    ratings: p.ratings,
    images: p.images,
    categoryId: p.categoryId
  }));

  const resultPayload = {
    reply: replyText,
    products: formattedClientProducts,
    suggestions: suggestionsList
  };

  // Cache result to optimize performance on future calls
  chatCache.set(cacheKey, resultPayload);

  return res.status(200).json(resultPayload);
});

// @desc    Get logged in user's persisted chat history
// @route   GET /api/chat/history
// @access  Private
export const getChatHistory = catchAsync(async (req, res, next) => {
  let userId = null;
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Invalid session
    }
  }

  if (!userId) {
    return res.status(200).json({ messages: [] });
  }

  let chatSession = await Chat.findOne({ userId });
  if (!chatSession) {
    chatSession = await Chat.create({ userId, messages: [] });
  }

  const clientHistory = chatSession.messages.map((m, idx) => ({
    id: `db_${m._id || idx}`,
    sender: m.role === 'model' ? 'ai' : 'user',
    text: m.text,
    createdAt: m.createdAt || new Date(),
    products: [],
    suggestions: []
  }));

  return res.status(200).json({ messages: clientHistory });
});

// @desc    Clear logged in user's chat history
// @route   POST /api/chat/clear
// @access  Private
export const clearChatHistory = catchAsync(async (req, res, next) => {
  let userId = null;
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Invalid session
    }
  }

  if (userId) {
    await Chat.findOneAndUpdate(
      { userId },
      { $set: { messages: [] } },
      { upsert: true }
    );
    // Invalidate cache for user's queries
    chatCache.clear();
  }

  return res.status(200).json({
    status: 'success',
    message: 'Chat history cleared successfully.'
  });
});
