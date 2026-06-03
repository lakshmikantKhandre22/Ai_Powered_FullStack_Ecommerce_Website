import Review from '../models/Review.js';
import Product from '../models/Product.js';
import CustomError from '../utils/customError.js';
import { catchAsync } from '../middleware/authMiddleware.js';

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ productId: req.params.productId })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    reviews
  });
});

// @desc    Create a product review
// @route   POST /api/reviews
// @access  Private
export const createReview = catchAsync(async (req, res, next) => {
  const { productId, rating, comment } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new CustomError('Product not found', 404));
  }

  // Check if user already left a review
  const alreadyReviewed = await Review.findOne({ userId: req.user._id, productId });
  if (alreadyReviewed) {
    return next(new CustomError('You have already submitted a review for this product', 400));
  }

  const review = await Review.create({
    userId: req.user._id,
    productId,
    rating: Number(rating),
    comment
  });

  res.status(201).json({
    status: 'success',
    review
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new CustomError('Review not found', 404));
  }

  // Check permissions (Only review author or admin can delete)
  if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new CustomError('You do not have permission to delete this review', 403));
  }

  // Use deleteOne instead of findByIdAndDelete so that Mongoose post-remove hook recalculates scores
  await Review.deleteOne({ _id: req.params.id });

  // Explicitly recalculate rating stats as findOneAndDelete pre hooks can be finicky in older Mongoose
  await Review.calculateAverageRating(review.productId);

  res.status(200).json({
    status: 'success',
    message: 'Review deleted successfully'
  });
});
