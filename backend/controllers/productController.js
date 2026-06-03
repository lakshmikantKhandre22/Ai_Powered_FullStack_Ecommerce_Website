import Product from '../models/Product.js';
import Category from '../models/Category.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get all products with full searching, filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
export const getAllProducts = catchAsync(async (req, res, next) => {
  // 1) Prepare baseline query object
  const queryObj = {};

  // 2) Fuzzy/Regex Search and Smart AI Conversational Parser
  if (req.query.search) {
    const rawSearch = req.query.search.toLowerCase().trim();
    
    // Check if it is a conversational / smart search query
    const isConversational = rawSearch.split(/\s+/).length > 2 || 
                            rawSearch.includes('i want') || 
                            rawSearch.includes('show me') || 
                            rawSearch.includes('looking for') || 
                            rawSearch.includes('need a');
                            
    if (isConversational) {
      let searchKeywords = [];

      // A. Extract product type keywords & map Category IDs
      if (rawSearch.includes('laptop') || rawSearch.includes('computer') || rawSearch.includes('pc')) {
        searchKeywords.push('laptop');
        const cat = await Category.findOne({ name: /Electronics/i });
        if (cat) queryObj.categoryId = cat._id;
      }
      if (rawSearch.includes('phone') || rawSearch.includes('mobile') || rawSearch.includes('smartphone')) {
        searchKeywords.push('phone', 'smartphone', 'galaxy', 'narzo', 'note');
        const cat = await Category.findOne({ name: /Electronics/i });
        if (cat) queryObj.categoryId = cat._id;
      }
      if (rawSearch.includes('headphone') || rawSearch.includes('earbud') || rawSearch.includes('sound') || rawSearch.includes('speaker')) {
        searchKeywords.push('headphones', 'earbuds', 'speaker', 'audio', 'sound');
        const cat = await Category.findOne({ name: /Electronics/i });
        if (cat) queryObj.categoryId = cat._id;
      }
      if (rawSearch.includes('shirt') || rawSearch.includes('jacket') || rawSearch.includes('sweater') || rawSearch.includes('cloth') || rawSearch.includes('wear')) {
        searchKeywords.push('shirt', 'jacket', 'sweater', 'clothing', 'wear');
        const cat = await Category.findOne({ name: /Fashion/i });
        if (cat) queryObj.categoryId = cat._id;
      }
      if (rawSearch.includes('mug') || rawSearch.includes('tea') || rawSearch.includes('lamp') || rawSearch.includes('purifier') || rawSearch.includes('quilt') || rawSearch.includes('home') || rawSearch.includes('kitchen')) {
        searchKeywords.push('mug', 'tea', 'lamp', 'purifier', 'quilt', 'home', 'kitchen');
        const cat = await Category.findOne({ name: /Home/i });
        if (cat) queryObj.categoryId = cat._id;
      }
      if (rawSearch.includes('serum') || rawSearch.includes('gel') || rawSearch.includes('wash') || rawSearch.includes('skin') || rawSearch.includes('beauty') || rawSearch.includes('wellness')) {
        searchKeywords.push('serum', 'gel', 'wash', 'face', 'beauty', 'wellness');
        const cat = await Category.findOne({ name: /Beauty/i });
        if (cat) queryObj.categoryId = cat._id;
      }

      // B. Extract utility adjectives / intent keywords
      if (rawSearch.includes('light') || rawSearch.includes('lightweight') || rawSearch.includes('portable')) {
        searchKeywords.push('lightweight', 'portable', 'compact', 'breathable', 'Australian Merino', 'flax linen');
      }
      if (rawSearch.includes('coding') || rawSearch.includes('college') || rawSearch.includes('work') || rawSearch.includes('study') || rawSearch.includes('productivity') || rawSearch.includes('office')) {
        searchKeywords.push('productivity', 'professional', 'commuter', 'ergonomic', 'performance', 'tactile');
      }
      if (rawSearch.includes('premium') || rawSearch.includes('expensive') || rawSearch.includes('best') || rawSearch.includes('elite') || rawSearch.includes('timeless')) {
        searchKeywords.push('premium', 'elite', 'artisanal', 'genuine', 'handcrafted', 'flagship');
      }
      if (rawSearch.includes('cheap') || rawSearch.includes('budget') || rawSearch.includes('affordable')) {
        searchKeywords.push('affordable', 'value', 'compact', 'budget');
      }

      // C. Extract price limits dynamically in query (e.g. "under 20000" or "below 3000")
      const parsedMessage = rawSearch.replace(/(\d+),(\d+)/g, '$1$2'); // Strip commas
      const priceMatch = parsedMessage.match(/under\s*(?:₹|rs\.?)?\s*(\d+)/i) || 
                         parsedMessage.match(/below\s*(?:₹|rs\.?)?\s*(\d+)/i) ||
                         parsedMessage.match(/less\s*than\s*(?:₹|rs\.?)?\s*(\d+)/i);
      if (priceMatch) {
        const limit = parseInt(priceMatch[1]);
        queryObj.price = { $lte: limit };
      }

      // D. Construct fuzzy search across extracted target tokens
      if (searchKeywords.length > 0) {
        const orClauses = searchKeywords.map(kw => {
          const kwRegex = new RegExp(kw, 'i');
          return [
            { title: kwRegex },
            { brand: kwRegex },
            { description: kwRegex }
          ];
        }).flat();
        queryObj.$or = orClauses;
      } else {
        // Fallback standard search if no smart keywords detected
        const searchRegex = new RegExp(req.query.search, 'i');
        queryObj.$or = [
          { title: searchRegex },
          { brand: searchRegex },
          { description: searchRegex }
        ];
      }
    } else {
      // Standard keyword search
      const searchRegex = new RegExp(req.query.search, 'i');
      queryObj.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { description: searchRegex }
      ];
    }
  }

  // 3) Category Filter
  if (req.query.category) {
    // If we received a category slug, find the Category ID first
    const category = await Category.findOne({ slug: req.query.category });
    if (category) {
      queryObj.categoryId = category._id;
    } else if (req.query.category.match(/^[0-9a-fA-F]{24}$/)) {
      // Direct Category ObjectId
      queryObj.categoryId = req.query.category;
    }
  }

  // 4) Brand Filter
  if (req.query.brand) {
    const brands = req.query.brand.split(',');
    queryObj.brand = { $in: brands.map(b => new RegExp(`^${b.trim()}$`, 'i')) };
  }

  // 5) Price Range Filter (minPrice / maxPrice)
  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  // 6) Rating Filter (minRating)
  if (req.query.minRating) {
    queryObj.ratings = { $gte: Number(req.query.minRating) };
  }

  // 7) Stock availability filter (optional, show only in stock items)
  if (req.query.inStock === 'true') {
    queryObj.stock = { $gt: 0 };
  }

  // Initialize Mongoose query builder
  let query = Product.find(queryObj);

  // 8) Sorting
  if (req.query.sortBy) {
    const sortVal = req.query.sortBy;
    if (sortVal === 'price-asc') {
      query = query.sort({ price: 1 });
    } else if (sortVal === 'price-desc') {
      query = query.sort({ price: -1 });
    } else if (sortVal === 'rating-desc') {
      query = query.sort({ ratings: -1 });
    } else if (sortVal === 'newest') {
      query = query.sort({ createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 }); // Fallback: Newest
    }
  } else {
    query = query.sort({ createdAt: -1 }); // Default newest
  }

  // 9) Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 8; // Default 8 products per grid
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Execute query and retrieve product documents
  const products = await query.populate('categoryId', 'name slug');
  
  // Total matches count for frontend page calculations
  const totalProducts = await Product.countDocuments(queryObj);

  // Calculate unique brands for left-rail filters
  const allBrands = await Product.distinct('brand');

  res.status(200).json({
    status: 'success',
    totalProducts,
    page,
    pages: Math.ceil(totalProducts / limit),
    limit,
    brands: allBrands,
    products
  });
});

// @desc    Get a single product details
// @route   GET /api/products/:id
// @access  Public
export const getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('categoryId', 'name slug');
  if (!product) {
    return next(new CustomError('Product not found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    product
  });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = catchAsync(async (req, res, next) => {
  const { title, description, price, discountPrice, stock, brand, images, categoryId } = req.body;

  // Validate category exists
  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    return next(new CustomError('Selected category does not exist', 400));
  }

  const product = await Product.create({
    title,
    description,
    price,
    discountPrice: discountPrice || 0,
    stock,
    brand,
    images: images || ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop'],
    categoryId
  });

  res.status(201).json({
    status: 'success',
    product
  });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = catchAsync(async (req, res, next) => {
  const { title, description, price, discountPrice, stock, brand, images, categoryId } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError('Product not found with that ID', 404));
  }

  if (categoryId) {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return next(new CustomError('Selected category does not exist', 400));
    }
    product.categoryId = categoryId;
  }

  if (title) product.title = title;
  if (description) product.description = description;
  if (price !== undefined) product.price = price;
  if (discountPrice !== undefined) product.discountPrice = discountPrice;
  if (stock !== undefined) product.stock = stock;
  if (brand) product.brand = brand;
  if (images) product.images = images;

  await product.save();

  res.status(200).json({
    status: 'success',
    product
  });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(new CustomError('Product not found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Product successfully deleted'
  });
});

// @desc    Upload product image to Cloudinary
// @route   POST /api/products/upload
// @access  Private/Admin
export const uploadProductImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError('Please provide an image file to upload!', 400));
  }

  // Configure Cloudinary dynamically from env
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'shopsphere_cloud',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const uploadStream = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'shopsphere_products',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(fileBuffer);
    });
  };

  try {
    const result = await uploadStream(req.file.buffer);
    res.status(200).json({
      status: 'success',
      url: result.secure_url
    });
  } catch (err) {
    return next(new CustomError(`Cloudinary upload failed: ${err.message}`, 500));
  }
});
