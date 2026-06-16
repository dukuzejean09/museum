import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  createEvaluation,
  getEvaluations,
  getEvaluationStats,
  exportEvaluations,
  deleteEvaluation,
} from '../controllers/evaluationController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.post('/', createEvaluation);

// Admin (protected)
adminRouter.get('/', protect, getEvaluations);
adminRouter.get('/stats', protect, getEvaluationStats);
adminRouter.get('/export', protect, exportEvaluations);
adminRouter.delete('/:id', protect, requireRole('admin'), deleteEvaluation);

export { publicRouter, adminRouter };
