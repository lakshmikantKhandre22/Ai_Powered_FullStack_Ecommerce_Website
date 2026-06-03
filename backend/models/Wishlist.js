import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound index to make sure same user cannot wishlist the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
