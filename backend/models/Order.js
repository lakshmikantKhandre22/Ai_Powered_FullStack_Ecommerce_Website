import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: true // Captures purchase-time price for historical record
        }
      }
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Stripe', 'Razorpay', 'COD'],
      default: 'Stripe'
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be positive']
    },
    deliveredAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
