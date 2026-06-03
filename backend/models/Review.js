import mongoose from 'mongoose';
import Product from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product']
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot be more than 5 stars']
    },
    comment: {
      type: String,
      required: [true, 'Please write a review comment'],
      trim: true,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Prevent user from leaving multiple reviews for the same product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Static method to calculate average rating and number of reviews
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { productId }
    },
    {
      $group: {
        _id: '$productId',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratings: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal place (e.g. 4.5)
      reviewsCount: stats[0].nRatings
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratings: 0,
      reviewsCount: 0
    });
  }
};

// Recalculate average rating after review is saved
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.productId);
});

// Recalculate average rating when a review is updated or deleted
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.productId);
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
