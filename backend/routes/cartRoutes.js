import express from 'express';
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  syncCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartQuantity);
router.post('/sync', syncCart);
router.delete('/remove/:productId', removeFromCart);

export default router;
