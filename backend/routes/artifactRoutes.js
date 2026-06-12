import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import upload, { validateUpload } from '../middleware/upload.js';
import {
  getArtifacts, getArtifactById, createArtifact, updateArtifact, deleteArtifact,
} from '../controllers/artifactController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

const artifactUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalImages', maxCount: 20 },
]);

// Public
publicRouter.get('/', getArtifacts);
publicRouter.get('/:id', getArtifactById);

// Admin + Guide
adminRouter.get('/', protect, requireRole('admin', 'guide'), getArtifacts);
adminRouter.get('/:id', protect, requireRole('admin', 'guide'), getArtifactById);
adminRouter.post('/', protect, requireRole('admin', 'guide'), artifactUpload, validateUpload, createArtifact);
adminRouter.put('/:id', protect, requireRole('admin', 'guide'), artifactUpload, validateUpload, updateArtifact);

// Admin only
adminRouter.delete('/:id', protect, requireRole('admin'), deleteArtifact);

export { publicRouter, adminRouter };
