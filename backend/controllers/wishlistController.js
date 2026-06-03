import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// @desc    Get user wishlist items
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.find({ userId: req.user._id }).populate({
    path: 'productId',
    select: 'title price discountPrice images stock brand ratings reviewsCount'
  });

  res.status(200).json({
    status: 'success',
    results: wishlist.length,
    wishlist
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  // Check if already wishlisted
  const exists = await Wishlist.findOne({ userId: req.user._id, productId });
  if (exists) {
    return next(new CustomError('Product is already in your wishlist', 400));
  }

  const wishlistItem = await Wishlist.create({
    userId: req.user._id,
    productId
  });

  res.status(201).json({
    status: 'success',
    wishlistItem
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlistItem = await Wishlist.findOneAndDelete({
    userId: req.user._id,
    productId
  });

  if (!wishlistItem) {
    return next(new CustomError('Product not found in your wishlist', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Product removed from wishlist'
  });
});
