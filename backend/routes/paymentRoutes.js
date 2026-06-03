import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  processStripePayment,
  savePaymentRecord
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/stripe/intent', processStripePayment);
router.post('/record', savePaymentRecord);

export default router;
