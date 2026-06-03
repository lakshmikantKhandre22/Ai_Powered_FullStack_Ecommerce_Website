import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: [0, 'Price must be positive']
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          // 'this' refers to doc, only works on save/create
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be lower than the actual price'
      }
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    brand: {
      type: String,
      required: [true, 'Please provide a brand name'],
      trim: true
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one product image']
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please associate this product with a category']
    },
    ratings: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    reviewsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high performance querying, text searches, and filters
productSchema.index({ title: 'text', brand: 'text', description: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
