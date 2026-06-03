import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce full admin block protection on all endpoints in this router
router.use(protect, restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
