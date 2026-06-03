import express from 'express';
import multer from 'multer';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer in-memory storage setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Exposed upload route (must be mounted before /:id)
router.post('/upload', protect, restrictTo('admin'), upload.single('image'), uploadProductImage);

router
  .route('/')
  .get(getAllProducts)
  .post(protect, restrictTo('admin'), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, restrictTo('admin'), updateProduct)
  .delete(protect, restrictTo('admin'), deleteProduct);

export default router;
