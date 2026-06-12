import express from 'express';
import upload from '../middleware/upload.js';
import { identifyExhibit, narrateExhibit } from '../controllers/aiController.js';

const router = express.Router();

// Public — visitors can use AI features without admin auth
router.post('/identify', upload.single('image'), identifyExhibit);
router.post('/narrate', narrateExhibit);

export default router;
