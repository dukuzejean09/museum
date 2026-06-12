import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  createMessage, getMessages, getMessageById,
  replyToMessage, updateMessageStatus, assignMessage, deleteMessage,
} from '../controllers/messageController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.post('/', createMessage);

// Admin + Guide (protected)
adminRouter.get('/', protect, requireRole('admin', 'guide'), getMessages);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getMessageById);
adminRouter.post('/:id/reply', protect, requireRole('admin', 'guide'), replyToMessage);
adminRouter.put('/:id/status', protect, requireRole('admin', 'guide'), updateMessageStatus);
adminRouter.put('/:id/assign', protect, requireRole('admin'), assignMessage);

// Admin only
adminRouter.delete('/:id', protect, requireRole('admin'), deleteMessage);

export { publicRouter, adminRouter };
