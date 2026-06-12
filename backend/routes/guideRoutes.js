import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import upload from '../middleware/upload.js';
import { getGuides, getGuideById, createGuide, updateGuide, deleteGuide, getMyProfile, updateMyProfile } from '../controllers/guideController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();
const guideRouter = express.Router();

// Public
publicRouter.get('/', getGuides);

// Admin only (protected)
adminRouter.get('/', protect, requireRole('admin'), getGuides);
adminRouter.get('/:id', protect, requireRole('admin'), getGuideById);
adminRouter.post('/', protect, requireRole('admin'), upload.single('image'), createGuide);
adminRouter.put('/:id', protect, requireRole('admin'), upload.single('image'), updateGuide);
adminRouter.delete('/:id', protect, requireRole('admin'), deleteGuide);

// Guide self-service profile (guide + admin can access)
guideRouter.get('/profile', protect, requireRole('guide', 'admin'), getMyProfile);
guideRouter.put('/profile', protect, requireRole('guide', 'admin'), upload.single('image'), updateMyProfile);

export { publicRouter, adminRouter, guideRouter };
