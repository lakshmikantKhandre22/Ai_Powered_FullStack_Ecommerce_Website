import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router
  .route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.delete('/:productId', removeFromWishlist);

export default router;
