import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { getStories, getStoryById, createStory, updateStory, deleteStory } from '../controllers/storyController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.get('/', getStories);
publicRouter.get('/:id', getStoryById);

// Admin + Guide
adminRouter.get('/', protect, requireRole('admin', 'guide'), getStories);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getStoryById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), express.json(), createStory);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), express.json(), updateStory);

// Admin only
adminRouter.delete('/:id', protect, requireRole('admin'), deleteStory);

export { publicRouter, adminRouter };
