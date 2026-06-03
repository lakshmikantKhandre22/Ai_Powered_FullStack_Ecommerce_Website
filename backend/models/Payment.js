import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Succeeded', 'Pending', 'Failed'],
      default: 'Pending'
    },
    paymentGateway: {
      type: String,
      required: true,
      enum: ['Stripe', 'Razorpay', 'COD'],
      default: 'Stripe'
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ orderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
