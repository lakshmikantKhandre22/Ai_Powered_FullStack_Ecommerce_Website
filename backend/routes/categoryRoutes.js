import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getAllCategories)
  .post(protect, restrictTo('admin'), createCategory);

router
  .route('/:id')
  .put(protect, restrictTo('admin'), updateCategory)
  .delete(protect, restrictTo('admin'), deleteCategory);

export default router;
