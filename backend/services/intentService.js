// Using native global fetch available in Node.js 18+

class IntentService {
  constructor() {
    this.modelName = 'gemini-3.5-flash';
  }

  getGeminiKey() {
    return process.env.GEMINI_API_KEY;
  }

  async detectIntentAndFilters(message, history = [], categoryNames = []) {
    const key = this.getGeminiKey();
    if (!key) {
      console.warn('Gemini API Key is not configured for Intent Detection.');
      return {
        intent: { intent: 'search_products', confidence: 0.5 },
        filters: this.getDefaultFilters()
      };
    }

    const historyText = history
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const prompt = `You are an advanced shopping assistant intent classifier and filter extractor.
Your job is to analyze the User Query and Chat History to:
1. Classify the user query into a primary intent.
2. Extract shopping filters, categories, and keywords.

---
POSSIBLE INTENTS:
- "search_products": User wants to search for products.
- "recommend_products": User wants recommendations (e.g., "suggest some good...", "what do you recommend").
- "compare_products": User wants to compare two or more products (e.g., "compare X and Y", "what's the difference between X and Y").
- "explain_product": User wants explanation of a specific product.
- "product_details": User wants specifications, price, or details of a single product.
- "find_alternatives": User wants alternatives/similar items to a product.
- "compatibility_check": User asks if a product is compatible with another product/setup.
- "budget_planning": User wants to build a package or list within a specific total budget (e.g., "build a PC build for 50k").
- "feature_based_selection": User specifies a must-have feature (e.g., "noise cancelling", "waterproof").
- "availability_check": User wants to know if an item is in stock.
- "category_exploration": User wants to explore what categories/brands are available.
- "customer_support": General customer service questions (e.g., return policy, shipping rules).
- "order_help": Tracking orders, looking up past orders.
- "faq": Frequently asked questions about the store/services.
- "greetings": Greetings, hello, hi, how are you.
- "follow_up": Follow-up or correction, continuing context of the last statement.
- "unrelated": Completely out-of-scope queries (e.g., "who is the president", "write a python function").

---
ENTITY EXTRACTION RULES:
- Extracted filters must be general and support any category (electronics, fashion, grocery, books, beauty, etc.).
- Missing fields should remain null (do not invent or force values).
- If the user is refining their search (e.g. User: "show phones under 25000", then User: "only samsung"), carry over and merge filters where relevant.
- "compare_items": Extract the names/titles of products the user wants to compare.
- "budget": Extract the total budget for the search/planning query.
- "keywords": Extract descriptive keywords from the query. Always extract keywords in their singular base form (e.g. "phone" instead of "phones", "laptop" instead of "laptops", "shoe" instead of "shoes") to maximize database search compatibility.

Available store categories:
${categoryNames.join(', ')}

Output a JSON object matching this schema:
{
  "intent": {
    "intent": "intent_name",
    "confidence": 0.0 to 1.0
  },
  "filters": {
    "category": string or null,
    "subcategory": string or null,
    "brand": string or null,
    "product_name": string or null,
    "minPrice": number or null,
    "maxPrice": number or null,
    "rating": number or null,
    "quantity": number or null,
    "features": string[],
    "preferences": string[],
    "use_case": string or null,
    "constraints": string[],
    "sort_by": string or null,
    "compare_items": string[],
    "budget": number or null,
    "keywords": string[]
  }
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${prompt}\n\nChat History:\n${historyText}\n\nUser Query: "${message}"` }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const result = JSON.parse(text.trim());
          // Standardize response
          if (result.intent && result.filters) {
            return {
              intent: {
                intent: result.intent.intent || 'search_products',
                confidence: Number(result.intent.confidence) || 0.8
              },
              filters: {
                ...this.getDefaultFilters(),
                ...result.filters
              }
            };
          }
        }
      } else {
        const errText = await response.text();
        console.error('Intent Detection API Error:', errText);
      }
    } catch (err) {
      console.error('Intent Detection request failed:', err);
    }

    // Fallback if anything fails
    return {
      intent: { intent: 'search_products', confidence: 0.5 },
      filters: this.getDefaultFilters()
    };
  }

  getDefaultFilters() {
    return {
      category: null,
      subcategory: null,
      brand: null,
      product_name: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      quantity: null,
      features: [],
      preferences: [],
      use_case: null,
      constraints: [],
      sort_by: null,
      compare_items: [],
      budget: null,
      keywords: []
    };
  }
}

const intentService = new IntentService();
export default intentService;
export { IntentService };
