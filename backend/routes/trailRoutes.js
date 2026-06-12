import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import upload, { validateUpload } from '../middleware/upload.js';
import { getTrails, getTrailById, getFeaturedTrails, createTrail, updateTrail, deleteTrail } from '../controllers/trailController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

const trailUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// Public
publicRouter.get('/featured', getFeaturedTrails);
publicRouter.get('/', getTrails);
publicRouter.get('/:id', getTrailById);

// Admin + Guide
adminRouter.get('/', protect, requireRole('admin', 'guide'), getTrails);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getTrailById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), trailUpload, validateUpload, createTrail);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), trailUpload, validateUpload, updateTrail);

// Admin only
adminRouter.delete('/:id', protect, requireRole('admin'), deleteTrail);

export { publicRouter, adminRouter };
