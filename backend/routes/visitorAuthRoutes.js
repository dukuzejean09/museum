import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
  generateAccessCode,
  validateAccessCode,
  listAccessCodes,
  deactivateAccessCode,
} from '../controllers/visitorAuthController.js';

const router = express.Router();

// Public — visitor scans QR, validates code, gets token
router.post('/validate', validateAccessCode);

// Admin-protected — manage access codes
router.get('/codes', protect, listAccessCodes);
router.post('/codes', protect, generateAccessCode);
router.put('/codes/:id/deactivate', protect, deactivateAccessCode);

export default router;
