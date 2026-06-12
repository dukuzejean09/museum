import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { generateExhibitionQR } from '../controllers/qrController.js';

const router = express.Router();

router.get('/exhibition/:exhibitionId', protect, generateExhibitionQR);

export default router;
