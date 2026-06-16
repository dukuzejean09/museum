import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { generateExhibitionQR, generateArtifactQR } from '../controllers/qrController.js';

const router = express.Router();

router.get('/exhibition/:exhibitionId', protect, generateExhibitionQR);
router.get('/artifact/:artifactId', protect, generateArtifactQR);

export default router;
