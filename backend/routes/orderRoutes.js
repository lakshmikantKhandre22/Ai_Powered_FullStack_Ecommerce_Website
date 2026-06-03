import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All order routes require active authorization
router.use(protect);

router
  .route('/')
  .post(createOrder)
  .get(restrictTo('admin'), getAllOrders);

router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

// Admin-only shipping updates
router.put('/:id/status', restrictTo('admin'), updateOrderStatus);

export default router;
