import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import upload from '../middleware/upload.js';
import { getStories, getStoryById, createStory, updateStory, deleteStory } from '../controllers/storyController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

const storyUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'narration', maxCount: 1 },
  { name: 'media', maxCount: 10 },
]);

// Public
publicRouter.get('/', getStories);
publicRouter.get('/:id', getStoryById);

// Admin + Guide
adminRouter.get('/', protect, requireRole('admin', 'guide'), getStories);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getStoryById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), storyUpload, createStory);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), storyUpload, updateStory);

// Admin only
adminRouter.delete('/:id', protect, requireRole('admin'), deleteStory);

export { publicRouter, adminRouter };
