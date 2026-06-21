import jwt from 'jsonwebtoken';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// Helper: Resolve category fuzzy name match
const resolveCategoryId = async (categoryName) => {
  if (!categoryName) return null;
  // Match closely against Category name regex
  const dbCat = await Category.findOne({
    name: { $regex: new RegExp(categoryName.replace(/[^a-zA-Z0-9]/g, ''), 'i') }
  });
  if (dbCat) return dbCat._id;

  // Fuzzy match substring checking
  const allCats = await Category.find({});
  const matched = allCats.find(c => 
    c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
    categoryName.toLowerCase().includes(c.name.toLowerCase())
  );
  return matched ? matched._id : null;
};

// @desc    Upgraded Intelligent Shopping Assistant Chatbot
// @route   POST /api/chat
// @access  Public
export const handleAiChat = catchAsync(async (req, res, next) => {
  const { message, history } = req.body;

  if (!message) {
    return next(new CustomError('Please provide a message!', 400));
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return next(new CustomError('Gemini API key is not configured in backend .env', 500));
  }

  // 1. Extract logged-in userId from JWT Bearer token or HttpOnly cookie
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
      // Ignore invalid session token, proceed as anonymous
    }
  }

  // Get active categories list for intent mapping context
  let categoryNames = [];
  try {
    const categories = await Category.find({}, 'name');
    categoryNames = categories.map(c => c.name);
  } catch (err) {
    console.warn('Failed to pre-fetch categories list:', err);
  }

  // 2. Perform Stateful Intent Detection and Context Parameter Extraction
  const activeHistory = (history || []).slice(-10);
  const historyText = activeHistory
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
    .join('\n');

  const intentExtractionPrompt = `You are an expert shopping intent classification system.
Your job is to analyze the user's current message and the conversation history to:
1. Detect the primary intent from: "product_search", "recommendation", "comparison", "tracking", "review_summary", "personalized", "budget_search".
2. Extract criteria matching this intent (combine state filters from past queries if user is refining search criteria).

Available Category Names in our store:
${categoryNames.join(', ')}

Output a JSON object matching this schema:
{
  "intent": "product_search" | "recommendation" | "comparison" | "tracking" | "review_summary" | "personalized" | "budget_search",
  "category": string or null (closely mapped category name),
  "brand": string or null (e.g. "Samsung", "Xiaomi", "Dell", "AeroStride"),
  "budget": number or null (absolute maximum price cap),
  "priceRange": { "min": number, "max": number } or null,
  "keywords": string[] (descriptive specifications like "gaming", "coding", "active noise cancellation", "HEPA", "waterproof", "wireless"),
  "productName": string or null (name of a specific product the user is referring to, e.g. for review checks or details),
  "compareProducts": string[] or null (array of product titles or brands the user wants to compare)
}

Provide ONLY the raw JSON object, no Markdown brackets or enclosing tags.`;

  let extracted = {
    intent: 'product_search',
    category: null,
    brand: null,
    budget: null,
    priceRange: null,
    keywords: [],
    productName: null,
    compareProducts: null
  };

  try {
    const extResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${intentExtractionPrompt}\n\nChat History:\n${historyText}\n\nCurrent User Query: "${message}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (extResponse.ok) {
      const extData = await extResponse.json();
      const textResult = extData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textResult) {
        extracted = JSON.parse(textResult.trim());
      }
    }
  } catch (err) {
    console.error('Error during intent classification:', err);
  }

  // 3. Retrieval Layer: Fetch relevant context based on classified intent
  let dbProducts = [];
  let contextData = {
    orders: [],
    reviews: [],
    personalizedProfile: null,
    searchedItems: []
  };

  // Helper for Product Search and Filtering (shared by multiple intents)
  const fetchAndRankProducts = async (filters, keywords) => {
    let query = {};
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.brand) query.brand = { $regex: new RegExp(filters.brand.trim(), 'i') };
    
    const maxPrice = filters.budget || filters.priceRange?.max;
    const minPrice = filters.priceRange?.min || 0;
    if (maxPrice) {
      query.$or = [
        { discountPrice: { $gt: 0, $gte: minPrice, $lte: maxPrice } },
        { $and: [ { discountPrice: 0 }, { price: { $gte: minPrice, $lte: maxPrice } } ] }
      ];
    }

    if (keywords && keywords.length > 0) {
      const keywordRegex = keywords
        .map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .filter(Boolean)
        .join('|');
        
      if (keywordRegex) {
        const keywordQuery = {
          $or: [
            { title: { $regex: new RegExp(keywordRegex, 'i') } },
            { description: { $regex: new RegExp(keywordRegex, 'i') } },
            { brand: { $regex: new RegExp(keywordRegex, 'i') } }
          ]
        };
        if (query.$or) {
          query = { $and: [ { $or: query.$or }, keywordQuery ] };
        } else {
          query = { ...query, ...keywordQuery };
        }
      }
    }

    let products = await Product.find(query).populate('categoryId', 'name').lean();

    // Fallback if strict query returned nothing
    if (products.length === 0 && keywords && keywords.length > 0) {
      const fallbackRegex = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
      products = await Product.find({
        $or: [
          { title: { $regex: new RegExp(fallbackRegex, 'i') } },
          { description: { $regex: new RegExp(fallbackRegex, 'i') } }
        ]
      }).populate('categoryId', 'name').lean();
    }

    // Rank retrieved products
    const ranked = products.map(p => {
      let score = 0;
      const finalPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
      const titleLower = p.title.toLowerCase();
      const descLower = p.description.toLowerCase();

      // Keyword match
      if (keywords) {
        keywords.forEach(kw => {
          const kwLower = kw.toLowerCase();
          if (titleLower.includes(kwLower)) score += 15;
          if (descLower.includes(kwLower)) score += 5;
        });
      }

      // Budget match
      if (maxPrice) {
        if (finalPrice <= maxPrice) {
          score += 20;
          score += (1 - (maxPrice - finalPrice) / maxPrice) * 10;
        } else {
          score -= 25;
        }
      }

      // Ratings
      score += (p.ratings || 0) * 3;

      // Stock
      if (p.stock > 0) {
        score += 15;
      } else {
        score -= 10;
      }

      return { product: p, score };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, 8).map(sp => sp.product);
  };

  const resolvedCategoryId = await resolveCategoryId(extracted.category);

  // Intent Router
  switch (extracted.intent) {
    case 'tracking':
      if (userId) {
        try {
          contextData.orders = await Order.find({ userId })
            .populate('products.productId', 'title brand images')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        } catch (err) {
          console.warn('Failed to retrieve user orders context:', err);
        }
      }
      break;

    case 'review_summary':
      if (extracted.productName) {
        try {
          // Find matching product
          const targetProd = await Product.findOne({
            title: { $regex: new RegExp(extracted.productName.trim(), 'i') }
          });
          if (targetProd) {
            dbProducts = [targetProd];
            contextData.reviews = await Review.find({ productId: targetProd._id })
              .populate('userId', 'name')
              .limit(10)
              .lean();
          }
        } catch (err) {
          console.warn('Failed to retrieve reviews context:', err);
        }
      }
      break;

    case 'personalized':
      if (userId) {
        try {
          const cart = await Cart.findOne({ userId }).populate('products.productId');
          const wishlist = await Wishlist.find({ userId }).populate('productId');
          const orders = await Order.find({ userId }).populate('products.productId');

          const userProducts = [
            ...(cart ? cart.products.map(i => i.productId).filter(Boolean) : []),
            ...(wishlist.map(w => w.productId).filter(Boolean)),
            ...(orders.flatMap(o => o.products.map(i => i.productId)).filter(Boolean))
          ];

          // Extrapolate preferences from history
          if (userProducts.length > 0) {
            const lastProduct = userProducts[userProducts.length - 1];
            contextData.personalizedProfile = {
              lastProductTitle: lastProduct.title,
              categoryId: lastProduct.categoryId,
              brand: lastProduct.brand
            };
            
            // Search related items in same category/brand
            dbProducts = await Product.find({
              $and: [
                { _id: { $nin: userProducts.map(p => p._id) } },
                { $or: [ { categoryId: lastProduct.categoryId }, { brand: lastProduct.brand } ] }
              ]
            }).populate('categoryId', 'name').limit(8).lean();
          } else {
            // Fallback to top-rated general products if history is empty
            dbProducts = await Product.find({}).sort({ ratings: -1 }).populate('categoryId', 'name').limit(8).lean();
          }
        } catch (err) {
          console.warn('Failed to retrieve personalized context details:', err);
        }
      } else {
        // Unauthenticated defaults
        dbProducts = await Product.find({}).sort({ ratings: -1 }).populate('categoryId', 'name').limit(8).lean();
      }
      break;

    case 'comparison':
      if (extracted.compareProducts && extracted.compareProducts.length > 0) {
        try {
          const comparisonItems = [];
          for (const name of extracted.compareProducts) {
            const found = await Product.findOne({
              $or: [
                { title: { $regex: new RegExp(name.trim(), 'i') } },
                { brand: { $regex: new RegExp(name.trim(), 'i') } }
              ]
            }).populate('categoryId', 'name').lean();
            if (found) {
              comparisonItems.push(found);
            }
          }
          dbProducts = comparisonItems;
        } catch (err) {
          console.warn('Failed to retrieve comparison items:', err);
        }
      }
      break;

    case 'product_search':
    case 'recommendation':
    case 'budget_search':
    default:
      // Standard ranked query
      dbProducts = await fetchAndRankProducts(
        { categoryId: resolvedCategoryId, brand: extracted.brand, budget: extracted.budget, priceRange: extracted.priceRange },
        extracted.keywords
      );
      break;
  }

  // 4. Build Compact Context String for Gemini Prompt
  let generatedContextText = '';

  // Products context
  if (dbProducts && dbProducts.length > 0) {
    generatedContextText += `--- PRODUCTS CONTEXT ---\n`;
    dbProducts.forEach((p, idx) => {
      const finalPrice = p.discountPrice > 0 ? `₹${p.discountPrice} (Discounted, original price: ₹${p.price})` : `₹${p.price}`;
      generatedContextText += `[Product ${idx + 1}]
ID: ${p._id}
Title: "${p.title}"
Brand: "${p.brand}"
Category: "${p.categoryId?.name || 'Unknown'}"
Price: ${finalPrice}
Stock: ${p.stock > 0 ? `${p.stock} units available` : 'Out of stock'}
Rating: ${p.ratings || 0}/5 (${p.reviewsCount || 0} reviews)
Description: "${p.description}"
Link: "/product/${p._id}"\n\n`;
    });
  }

  // Orders Context (for Order tracking checks)
  if (contextData.orders && contextData.orders.length > 0) {
    generatedContextText += `--- USER ORDERS CONTEXT ---\n`;
    contextData.orders.forEach((order, idx) => {
      // Formulate expected delivery date
      const placedDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      let deliveryDateText = 'Not scheduled';
      if (order.orderStatus === 'Delivered') {
        deliveryDateText = `Delivered on ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN') : new Date(order.updatedAt).toLocaleDateString('en-IN')}`;
      } else if (order.orderStatus !== 'Cancelled') {
        const estDate = new Date(order.createdAt);
        estDate.setDate(estDate.getDate() + (order.orderStatus === 'Shipped' ? 3 : 5));
        deliveryDateText = `Estimated expected delivery: ${estDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      } else {
        deliveryDateText = 'Cancelled';
      }

      const productsPurchased = order.products
        .map(i => `${i.productId?.title || 'Unknown Product'} (Qty: ${i.quantity}, Price: ₹${i.price})`)
        .join(', ');

      generatedContextText += `Order #${order._id.toString().slice(-8).toUpperCase()}
Placed on: ${placedDate}
Items: ${productsPurchased}
Status: ${order.orderStatus}
Payment Status: ${order.paymentStatus}
Payment Method: ${order.paymentMethod}
Total Amount: ₹${order.totalAmount}
Delivery details: ${deliveryDateText}
Shipping Address: ${order.shippingAddress?.fullName}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}\n\n`;
    });
  }

  // Reviews context (for Review summarization)
  if (contextData.reviews && contextData.reviews.length > 0) {
    generatedContextText += `--- CUSTOMER REVIEWS CONTEXT ---\n`;
    contextData.reviews.forEach((rev, idx) => {
      generatedContextText += `Review ${idx + 1}
User: ${rev.userId?.name || 'Anonymous'}
Rating: ${rev.rating}/5
Comment: "${rev.comment}"\n\n`;
    });
  }

  // Personalized context
  if (contextData.personalizedProfile) {
    generatedContextText += `--- USER PURCHASE/BEHAVIOR PROFILE ---\n`;
    generatedContextText += `Last interacted item: "${contextData.personalizedProfile.lastProductTitle}" (Brand: ${contextData.personalizedProfile.brand})\n\n`;
  }

  // 5. Query Gemini 2.5 Flash with strict context bounding instructions
  const systemAssistantPrompt = `You are ShopSphere's Elite AI Concierge Shopping Assistant.
Your goal is to guide shoppers, recommend catalog products, compare items, summarize product reviews, check stock availability, and track orders.

RULES & CONTEXT RESTRICTIONS:
1. Answer the query ONLY using information from the "Retrieved Context" block below. Do NOT invent or make up products, prices, review comments, orders, stocks, or shipping ETAs.
2. If the user's intent is "tracking" and no user orders context is retrieved (or user is not logged in), politely invite them to [log in](/login) or [register](/register) to check their order history.
3. If no matching store items or related reviews exist in the context, respond strictly with: "Sorry, I couldn't find matching information." Do not invent items.
4. When recommending products: Explain exactly WHY you selected them from context (e.g. good battery, fits their exact budget, high star ratings). Use clean bullet points.
5. When comparing products: Present comparison details clearly (price, features, ratings, stock availability, pros and cons based on product descriptions and context).
6. If summarizing reviews: Output a clear breakdown detailing:
   Pros:
   Cons:
   Overall Sentiment:
7. Always display price values in Indian Rupees (₹).
8. Product details links MUST be output as structured Markdown strictly using the product ID: [View Details](/product/PRODUCT_ID). Do NOT use slug paths or invent other links.
9. Format your response strictly as a JSON object:
{
  "reply": "string (your markdown formatted assistant response text)",
  "suggestions": ["string", "string"] (2 to 3 short dynamic follow-up query suggestions based on this interaction)
}

Retrieved Context:
${generatedContextText || 'NO STORE DATA FOUND FOR THE SEARCH PARAMS.'}`;

  const finalMessages = [
    ...activeHistory.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ];

  let replyText = "Sorry, I couldn't find matching information.";
  let suggestionsList = [];

  try {
    const finalResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: finalMessages,
          systemInstruction: {
            parts: [{ text: systemAssistantPrompt }]
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
        suggestionsList = parsed.suggestions || [];
      }
    } else {
      const errText = await finalResponse.text();
      console.error('Final Generation API request error:', errText);
    }
  } catch (err) {
    console.error('Failed final generation model call:', err);
  }

  // Format context products list to render under the chat bubble
  const clientProductsList = dbProducts.map(p => ({
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

  return res.status(200).json({
    reply: replyText,
    products: clientProductsList,
    suggestions: suggestionsList
  });
});
