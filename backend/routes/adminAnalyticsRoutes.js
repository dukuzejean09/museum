import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { getDashboardStats, trackEvent, getContentAnalytics, getVisitorAnalytics } from '../controllers/analyticsController.js';

const adminRouter = express.Router();
const publicRouter = express.Router();

// Admin analytics
adminRouter.get('/', protect, getDashboardStats);
adminRouter.get('/content', protect, getContentAnalytics);
adminRouter.get('/visitors', protect, getVisitorAnalytics);

// Public event tracking (uses visitor token via visitorProtect in server.js)
publicRouter.post('/track', trackEvent);

export { adminRouter, publicRouter };
export default adminRouter;
