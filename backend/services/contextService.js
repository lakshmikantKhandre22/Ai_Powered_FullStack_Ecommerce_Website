class ContextService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
  }

  // Format and sanitize history to keep token counts small and format consistent
  formatHistory(history, maxTurns = 5) {
    if (!history || !Array.isArray(history)) return [];

    return history
      .slice(-maxTurns * 2) // Keep only the recent turns
      .map(msg => {
        // Normalize role name to user/model for Gemini standard format
        let role = 'user';
        if (msg.role === 'model' || msg.role === 'ai' || msg.sender === 'ai') {
          role = 'model';
        }
        return {
          role,
          text: msg.text || msg.reply || ''
        };
      })
      .filter(msg => msg.text.trim() !== '');
  }

  // Merges current turn filters with previous filters
  mergeFilters(prevFilters, currFilters, intent) {
    if (!prevFilters) return currFilters;

    // Reset filters if starting a totally new search / unrelated context
    if (
      intent === 'search_products' &&
      currFilters.category &&
      currFilters.category !== prevFilters.category
    ) {
      return currFilters;
    }

    if (intent === 'unrelated' || intent === 'greetings') {
      return currFilters;
    }

    const merged = { ...prevFilters };

    for (const key of Object.keys(currFilters)) {
      const val = currFilters[key];
      if (val !== null && val !== undefined) {
        if (Array.isArray(val)) {
          // Merge lists uniquely (e.g. features, compare_items, keywords)
          merged[key] = Array.from(new Set([...(merged[key] || []), ...val]));
        } else if (typeof val === 'object' && val !== null) {
          merged[key] = { ...merged[key], ...val };
        } else {
          // Keep/overwrite value
          merged[key] = val;
        }
      }
    }

    return merged;
  }

  // Extracts previous filters by scanning history messages for past intents and extractions
  // If the client doesn't store active filters, we can reconstruct them from user's queries in history
  reconstructFiltersFromHistory(history = []) {
    const filters = {
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

    if (!history || history.length === 0) return filters;

    // Simple heuristic parser for history questions (e.g. "under 25000" -> maxPrice: 25000)
    for (const msg of history) {
      if (msg.role === 'user' || msg.sender === 'user') {
        const text = (msg.text || '').toLowerCase();
        
        // Match numbers for budget/price constraints
        const priceMatch = text.match(/(?:under|below|less than|max)\s*(?:₹|rs\.?)?\s*(\d+)/i);
        if (priceMatch) {
          filters.maxPrice = parseInt(priceMatch[1], 10);
          filters.budget = filters.maxPrice;
        }

        // Match common brand words
        if (text.includes('samsung')) filters.brand = 'Samsung';
        if (text.includes('apple') || text.includes('iphone')) filters.brand = 'Apple';
        if (text.includes('dell')) filters.brand = 'Dell';
        if (text.includes('hp')) filters.brand = 'HP';
        if (text.includes('sony')) filters.brand = 'Sony';

        // Match category terms
        if (text.includes('phone') || text.includes('mobile')) filters.category = 'Electronics';
        if (text.includes('laptop') || text.includes('computer')) filters.category = 'Electronics';
        if (text.includes('shirt') || text.includes('jeans') || text.includes('shoes')) filters.category = 'Fashion';
      }
    }

    return filters;
  }
}

const contextService = new ContextService();
export default contextService;
export { ContextService };
