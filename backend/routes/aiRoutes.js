import express from 'express';
import { handleChat, getChatHistory, clearChatHistory } from '../controllers/chatController.js';

const router = express.Router();

// Maps to POST /api/chat
router.post('/', handleChat);

// Maps to GET /api/chat/history
router.get('/history', getChatHistory);

// Maps to POST /api/chat/clear
router.post('/clear', clearChatHistory);

export default router;
