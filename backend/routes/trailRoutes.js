import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import upload from '../middleware/upload.js';
import { getTrails, getTrailById, getFeaturedTrails, createTrail, updateTrail, deleteTrail } from '../controllers/trailController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.get('/featured', getFeaturedTrails);
publicRouter.get('/', getTrails);
publicRouter.get('/:id', getTrailById);

// Admin (protected)
adminRouter.get('/', protect, requireRole('admin', 'guide'), getTrails);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getTrailById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), upload.single('image'), createTrail);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), upload.single('image'), updateTrail);
adminRouter.delete('/:id', protect, requireRole('admin'), deleteTrail);

export { publicRouter, adminRouter };
