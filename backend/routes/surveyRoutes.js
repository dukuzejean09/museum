import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { createSurvey, getSurveys, getSurveyStats, deleteSurvey } from '../controllers/surveyController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.post('/', createSurvey);

// Admin (protected)
adminRouter.get('/', protect, getSurveys);
adminRouter.get('/stats', protect, getSurveyStats);
adminRouter.delete('/:id', protect, deleteSurvey);

export { publicRouter, adminRouter };
