import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fullName: {
      type: String,
      required: [true, 'Please provide the recipient name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide the city'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Please provide the state/province'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Please provide the postal/pincode'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Please provide the country'],
      trim: true,
      default: 'India'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexing
addressSchema.index({ userId: 1 });

const Address = mongoose.model('Address', addressSchema);
export default Address;
