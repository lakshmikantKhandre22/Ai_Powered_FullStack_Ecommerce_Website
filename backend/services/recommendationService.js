class RecommendationService {
  // Score and rerank database products based on user query features, budget, and ratings
  rankProducts(products, filters, preferenceProfile = null) {
    if (!products || products.length === 0) return [];

    const keywords = (filters.keywords || []).map(k => k.toLowerCase());
    const maxPrice = filters.maxPrice || filters.budget;
    const minPrice = filters.minPrice || 0;
    const targetBrand = filters.brand ? filters.brand.toLowerCase() : null;

    const scored = products.map(product => {
      let score = 0;
      const titleLower = product.title.toLowerCase();
      const descLower = product.description.toLowerCase();
      const brandLower = product.brand ? product.brand.toLowerCase() : '';
      
      const price = product.discountPrice > 0 ? product.discountPrice : product.price;

      // 1. Keyword Relevance Score
      keywords.forEach(kw => {
        if (titleLower.includes(kw)) score += 20; // Exact match in title
        if (descLower.includes(kw)) score += 5;   // Match in description
        if (brandLower.includes(kw)) score += 10;  // Match in brand name
      });

      // 2. Exact Brand Match Boost
      if (targetBrand && brandLower.includes(targetBrand)) {
        score += 35;
      }

      // 3. Price and Budget Optimization Score
      if (maxPrice) {
        if (price <= maxPrice) {
          score += 25;
          // Reward options close to the budget but not exceeding it (value-maximized)
          score += (1 - (maxPrice - price) / maxPrice) * 15;
        } else {
          // Penalize heavily if over budget
          score -= 50;
        }
      }
      if (minPrice > 0) {
        if (price >= minPrice) {
          score += 10;
        } else {
          score -= 15;
        }
      }

      // 4. Rating & Popularity Score
      score += (product.ratings || 0) * 4;
      score += Math.min(product.reviewsCount || 0, 50) * 0.2;

      // 5. Stock availability check
      if (product.stock > 0) {
        score += 15;
      } else {
        score -= 25; // Heavily penalize out-of-stock items
      }

      // 6. User Personalization Boost
      if (preferenceProfile) {
        if (preferenceProfile.brand && brandLower === preferenceProfile.brand.toLowerCase()) {
          score += 10;
        }
        if (preferenceProfile.categoryId && product.categoryId && 
            product.categoryId.toString() === preferenceProfile.categoryId.toString()) {
          score += 10;
        }
      }

      return { product, score };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return the ranked product objects
    return scored.map(item => ({
      ...item.product,
      recommendationScore: Math.round(item.score)
    }));
  }

  // Budget Optimizer: Fits combinations or selections within budget limit
  optimizeBudget(products, budget) {
    if (!budget || !products || products.length === 0) return products;
    
    // Sort products by score/price ratio or simply by rating descending
    const filtered = products.filter(p => {
      const price = p.discountPrice > 0 ? p.discountPrice : p.price;
      return price <= budget;
    });

    return filtered.slice(0, 5); // Return top 5 value-optimized options within budget
  }

  // Find alternatives in catalog if a product is out of stock or if requested
  findAlternatives(product, allProducts) {
    if (!product || !allProducts || allProducts.length === 0) return [];

    const targetCategoryId = product.categoryId?._id || product.categoryId;
    const targetPrice = product.price;

    const alternatives = allProducts
      .filter(p => p._id.toString() !== product._id.toString() && p.stock > 0)
      .map(p => {
        let similarity = 0;
        
        // Same category
        const pCategoryId = p.categoryId?._id || p.categoryId;
        if (pCategoryId && targetCategoryId && pCategoryId.toString() === targetCategoryId.toString()) {
          similarity += 50;
        }

        // Same brand
        if (p.brand && product.brand && p.brand.toLowerCase() === product.brand.toLowerCase()) {
          similarity += 30;
        }

        // Closeness in price
        const priceDiff = Math.abs(p.price - targetPrice);
        const pricePct = priceDiff / targetPrice;
        if (pricePct < 0.2) {
          similarity += 20;
        } else if (pricePct < 0.5) {
          similarity += 10;
        }

        return { product: p, similarity };
      });

    alternatives.sort((a, b) => b.similarity - a.similarity);
    return alternatives.slice(0, 4).map(item => item.product);
  }
}

const recommendationService = new RecommendationService();
export default recommendationService;
export { RecommendationService };
