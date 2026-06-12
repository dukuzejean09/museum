import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import upload from '../middleware/upload.js';
import {
  getExhibitions, getExhibitionById, createExhibition, updateExhibition,
  deleteExhibition, getFeaturedExhibitions,
} from '../controllers/exhibitionController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// No image uploads — exhibitions get images from linked artifacts.
// Only audio narrations are uploaded here.
const exhibitionUpload = upload.fields([
  { name: 'narrationFull', maxCount: 1 },
  { name: 'narrationPreview', maxCount: 1 },
]);

// Public
publicRouter.get('/featured', getFeaturedExhibitions);
publicRouter.get('/', getExhibitions);
publicRouter.get('/:id', getExhibitionById);

// Admin + Guide
adminRouter.get('/', protect, requireRole('admin', 'guide'), getExhibitions);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getExhibitionById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), exhibitionUpload, createExhibition);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), exhibitionUpload, updateExhibition);

// Admin only
adminRouter.delete('/:id', protect, requireRole('admin'), deleteExhibition);

export { publicRouter, adminRouter };
