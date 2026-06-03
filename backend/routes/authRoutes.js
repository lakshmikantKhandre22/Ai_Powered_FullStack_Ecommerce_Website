import express from 'express';
import {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Private profile routes (Require authentication)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
