import express from 'express';
import protect from '../middleware/authMiddleware.js';
import visitorProtect from '../middleware/visitorMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getDescriptors,
  rebuildDescriptors,
  validateDescriptorsEndpoint,
  uploadDescriptor,
} from '../controllers/arController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public: get all descriptors for client-side OpenCV matching (visitor or admin)
publicRouter.get('/descriptors', getDescriptors);

// Admin: descriptor management
adminRouter.post('/descriptors/rebuild', protect, requireRole('admin'), rebuildDescriptors);
adminRouter.post('/descriptors/validate', protect, requireRole('admin'), validateDescriptorsEndpoint);
adminRouter.post('/descriptors/upload', protect, requireRole('admin', 'guide'), uploadDescriptor);

export { publicRouter, adminRouter };
