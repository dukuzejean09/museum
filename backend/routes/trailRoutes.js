import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { getTrails, getTrailById, getFeaturedTrails, createTrail, updateTrail, deleteTrail } from '../controllers/trailController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.get('/featured', getFeaturedTrails);
publicRouter.get('/', getTrails);
publicRouter.get('/:id', getTrailById);

// Admin (protected) — no file uploads, trails use artifact images via stops
adminRouter.get('/', protect, requireRole('admin', 'guide'), getTrails);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getTrailById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), createTrail);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), updateTrail);
adminRouter.delete('/:id', protect, requireRole('admin'), deleteTrail);

export { publicRouter, adminRouter };
