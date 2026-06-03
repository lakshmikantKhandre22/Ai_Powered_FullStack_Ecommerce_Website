import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// @desc    Get user's shopping cart
// @route   GET /api/cart
// @access  Private
export const getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate({
    path: 'products.productId',
    select: 'title price discountPrice images stock brand'
  });

  // If user doesn't have a cart, create an empty one
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, products: [] });
  } else {
    // Self-healing: Purge any cart items referencing products that were deleted or re-seeded
    const originalLength = cart.products.length;
    cart.products = cart.products.filter(p => p.productId !== null);
    if (cart.products.length !== originalLength) {
      await cart.save();
    }
  }

  res.status(200).json({
    status: 'success',
    cart
  });
});

// @desc    Add product to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity) || 1;

  // Verify product exists and is in stock
  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  if (product.stock < qty) {
    return next(new CustomError(`Only ${product.stock} items left in stock.`, 400));
  }

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, products: [] });
  }

  // Check if product already exists in cart
  const itemIndex = cart.products.findIndex(p => p.productId.toString() === productId);

  if (itemIndex > -1) {
    // Increment quantity
    const newQty = cart.products[itemIndex].quantity + qty;
    if (product.stock < newQty) {
      return next(new CustomError(`Cannot add more. Only ${product.stock} items available in stock.`, 400));
    }
    cart.products[itemIndex].quantity = newQty;
  } else {
    // Add new product item
    cart.products.push({ productId, quantity: qty });
  }

  await cart.save();
  
  // Populate cart before sending back
  await cart.populate({
    path: 'products.productId',
    select: 'title price discountPrice images stock brand'
  });

  res.status(200).json({
    status: 'success',
    cart
  });
});

// @desc    Update quantity of product in cart
// @route   PUT /api/cart/update
// @access  Private
export const updateCartQuantity = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity);

  if (!productId || qty === undefined || qty < 1) {
    return next(new CustomError('Please provide a valid product ID and positive quantity.', 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  if (product.stock < qty) {
    return next(new CustomError(`Only ${product.stock} units are currently in stock.`, 400));
  }

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    return next(new CustomError('Cart not found', 404));
  }

  const itemIndex = cart.products.findIndex(p => p.productId.toString() === productId);
  if (itemIndex === -1) {
    return next(new CustomError('Product not found in cart', 404));
  }

  cart.products[itemIndex].quantity = qty;
  await cart.save();

  await cart.populate({
    path: 'products.productId',
    select: 'title price discountPrice images stock brand'
  });

  res.status(200).json({
    status: 'success',
    cart
  });
});

// @desc    Remove product from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
export const removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    return next(new CustomError('Cart not found', 404));
  }

  cart.products = cart.products.filter(p => p.productId.toString() !== productId);
  await cart.save();

  await cart.populate({
    path: 'products.productId',
    select: 'title price discountPrice images stock brand'
  });

  res.status(200).json({
    status: 'success',
    cart
  });
});

// @desc    Sync offline guest cart with user cart in database on login
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = catchAsync(async (req, res, next) => {
  const { products } = req.body; // Array of { productId, quantity }

  if (!products || !Array.isArray(products)) {
    return next(new CustomError('Invalid products list for cart sync.', 400));
  }

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, products: [] });
  }

  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) continue;

    const itemIndex = cart.products.findIndex(p => p.productId.toString() === item.productId);

    if (itemIndex > -1) {
      // Choose the larger quantity or add them, ensuring we don't exceed active stock
      const newQty = Math.min(cart.products[itemIndex].quantity + item.quantity, product.stock);
      cart.products[itemIndex].quantity = newQty;
    } else {
      const quantity = Math.min(item.quantity, product.stock);
      if (quantity > 0) {
        cart.products.push({ productId: item.productId, quantity });
      }
    }
  }

  await cart.save();

  await cart.populate({
    path: 'products.productId',
    select: 'title price discountPrice images stock brand'
  });

  res.status(200).json({
    status: 'success',
    cart
  });
});
