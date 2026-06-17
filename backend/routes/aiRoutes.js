import express from 'express';
import upload, { validateUpload } from '../middleware/upload.js';
import protect from '../middleware/authMiddleware.js';
import visitorProtect from '../middleware/visitorMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import { identifyExhibit, identifyVisitor, narrateExhibit } from '../controllers/aiController.js';

const router = express.Router();

// Protected — requires authenticated admin or guide
router.post('/identify', protect, requireRole('admin', 'guide'), upload.single('image'), validateUpload, identifyExhibit);
router.post('/narrate', protect, requireRole('admin', 'guide'), narrateExhibit);

// Visitor-accessible — requires visitor token OR admin token
router.post('/identify-visitor', visitorProtect, upload.single('image'), validateUpload, identifyVisitor);
router.post('/narrate-visitor', visitorProtect, narrateExhibit);

export default router;
