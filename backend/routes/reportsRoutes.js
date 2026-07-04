import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  getVisitorReport,
  getExhibitionReport,
  getArtifactReport,
  getBookingReport,
  getFeedbackReport,
  getUserActivityReport,
  getMuseumSummaryReport,
} from '../controllers/reportsController.js';

const router = express.Router();

// All report routes require admin authentication
router.use(protect);
router.use(requireRole('admin'));

router.get('/visitors', getVisitorReport);
router.get('/exhibitions', getExhibitionReport);
router.get('/artifacts', getArtifactReport);
router.get('/bookings', getBookingReport);
router.get('/feedback', getFeedbackReport);
router.get('/user-activity', getUserActivityReport);
router.get('/summary', getMuseumSummaryReport);

export default router;
