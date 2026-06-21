import { Product, Category, Review, Order } from '../db/dbClient.js';

class RetrievalService {
  // Resolve fuzzy category name match to MongoDB ObjectId
  async resolveCategoryId(categoryName) {
    if (!categoryName) return null;

    try {
      // 1. Strict regex match removing non-alphanumeric chars
      const sanitized = categoryName.replace(/[^a-zA-Z0-9]/g, '');
      const dbCat = await Category.findOne({
        name: { $regex: new RegExp(sanitized, 'i') }
      });
      if (dbCat) return dbCat._id;

      // 2. Fuzzy match against all category names
      const allCats = await Category.find({});
      const matched = allCats.find(c =>
        c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes(c.name.toLowerCase())
      );
      return matched ? matched._id : null;
    } catch (err) {
      console.warn('Error resolving category ID:', err);
      return null;
    }
  }

  // Primary retrieval function
  async retrieveProducts(filters) {
    const conditions = [];

    // 1. Category filter mapping
    if (filters.category) {
      const catId = await this.resolveCategoryId(filters.category);
      if (catId) {
        conditions.push({ categoryId: catId });
      }
    }

    // 2. Brand filter mapping
    if (filters.brand) {
      conditions.push({ brand: { $regex: new RegExp(filters.brand.trim(), 'i') } });
    }

    // 3. Price range / Budget mapping
    const minPrice = filters.minPrice || 0;
    const maxPrice = filters.maxPrice || filters.budget;
    if (maxPrice) {
      conditions.push({
        $or: [
          { discountPrice: { $gt: 0, $gte: minPrice, $lte: maxPrice } },
          { $and: [{ discountPrice: 0 }, { price: { $gte: minPrice, $lte: maxPrice } }] }
        ]
      });
    } else if (minPrice > 0) {
      conditions.push({
        $or: [
          { discountPrice: { $gt: 0, $gte: minPrice } },
          { $and: [{ discountPrice: 0 }, { price: { $gte: minPrice } }] }
        ]
      });
    }

    // 4. Rating filter mapping
    if (filters.rating) {
      conditions.push({ ratings: { $gte: Number(filters.rating) } });
    }

    // 5. Keyword search criteria mapping
    const keywords = filters.keywords || [];
    if (keywords.length > 0) {
      const keywordRegex = keywords
        .map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .filter(Boolean)
        .join('|');

      if (keywordRegex) {
        conditions.push({
          $or: [
            { title: { $regex: new RegExp(keywordRegex, 'i') } },
            { description: { $regex: new RegExp(keywordRegex, 'i') } },
            { brand: { $regex: new RegExp(keywordRegex, 'i') } }
          ]
        });
      }
    }

    // Combine conditions into final query
    const query = conditions.length > 0 ? { $and: conditions } : {};

    try {
      // Limit to 12 items for token efficiency and high quality candidates
      let products = await Product.find(query)
        .populate('categoryId', 'name')
        .limit(12)
        .lean();

      // Fallback query: If strict criteria returns 0 results, relax keyword/features search
      if (products.length === 0 && keywords.length > 0) {
        const relaxedConditions = [];
        
        // Preserve category and brand constraints
        if (filters.category) {
          const catId = await this.resolveCategoryId(filters.category);
          if (catId) relaxedConditions.push({ categoryId: catId });
        }
        if (filters.brand) {
          relaxedConditions.push({ brand: { $regex: new RegExp(filters.brand.trim(), 'i') } });
        }
        
        const fallbackRegex = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
        if (fallbackRegex) {
          relaxedConditions.push({
            $or: [
              { title: { $regex: new RegExp(fallbackRegex, 'i') } },
              { description: { $regex: new RegExp(fallbackRegex, 'i') } }
            ]
          });
        }

        const relaxedQuery = relaxedConditions.length > 0 ? { $and: relaxedConditions } : {};
        products = await Product.find(relaxedQuery)
          .populate('categoryId', 'name')
          .limit(12)
          .lean();
      }

      return products;
    } catch (err) {
      console.error('Error retrieving products:', err);
      return [];
    }
  }

  // Retrieve matching comparison products
  async retrieveComparisonProducts(compareItems) {
    if (!compareItems || compareItems.length === 0) return [];
    
    const products = [];
    for (const name of compareItems) {
      try {
        const found = await Product.findOne({
          $or: [
            { title: { $regex: new RegExp(name.trim(), 'i') } },
            { brand: { $regex: new RegExp(name.trim(), 'i') } }
          ]
        }).populate('categoryId', 'name').lean();
        if (found) {
          products.push(found);
        }
      } catch (err) {
        console.warn(`Error finding comparison item: ${name}`, err);
      }
    }
    return products;
  }

  // Retrieve user order context
  async retrieveUserOrders(userId) {
    if (!userId) return [];
    try {
      return await Order.find({ userId })
        .populate('products.productId', 'title brand images')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    } catch (err) {
      console.warn('Error retrieving orders context:', err);
      return [];
    }
  }

  // Retrieve product reviews context
  async retrieveReviews(productName) {
    if (!productName) return [];
    try {
      const targetProd = await Product.findOne({
        title: { $regex: new RegExp(productName.trim(), 'i') }
      });
      if (targetProd) {
        return await Review.find({ productId: targetProd._id })
          .populate('userId', 'name')
          .limit(8)
          .lean();
      }
    } catch (err) {
      console.warn('Error retrieving reviews:', err);
    }
    return [];
  }

  // Retrieve related products for recommendation personalization
  async retrievePersonalizedProducts(userId) {
    try {
      if (userId) {
        // Fetch cart, wishlist, and orders to understand user style/brand preferences
        const orders = await Order.find({ userId }).populate('products.productId').lean();
        
        const purchasedProductIds = orders.flatMap(o => o.products.map(i => i.productId?._id)).filter(Boolean);
        
        if (purchasedProductIds.length > 0) {
          const lastPurchased = orders[0].products[0].productId;
          if (lastPurchased) {
            // Find products in same category that the user hasn't bought yet
            const products = await Product.find({
              _id: { $nin: purchasedProductIds },
              $or: [
                { categoryId: lastPurchased.categoryId },
                { brand: lastPurchased.brand }
              ]
            })
              .populate('categoryId', 'name')
              .limit(8)
              .lean();
            return { products, preference: { title: lastPurchased.title, brand: lastPurchased.brand } };
          }
        }
      }
      
      // Default fallback: Top rated items
      const products = await Product.find({})
        .sort({ ratings: -1 })
        .populate('categoryId', 'name')
        .limit(8)
        .lean();
      return { products, preference: null };
    } catch (err) {
      console.warn('Error fetching personalized context:', err);
      return { products: [], preference: null };
    }
  }
}

const retrievalService = new RetrievalService();
export default retrievalService;
export { RetrievalService };
