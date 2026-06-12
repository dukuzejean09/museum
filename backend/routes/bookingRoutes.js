import express from 'express';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import {
  createBooking,
  getBookings,
  updateBookingStatus,
  generateBookingAccessCode,
  cancelBooking,
  deleteBooking,
} from '../controllers/bookingController.js';

const publicRouter = express.Router();
const adminRouter = express.Router();

// Public
publicRouter.post('/', createBooking);
publicRouter.post('/cancel', cancelBooking);

// Admin + Guide (protected)
adminRouter.get('/', protect, getBookings);
adminRouter.put('/:id', protect, updateBookingStatus);
adminRouter.post('/:id/access-code', protect, generateBookingAccessCode);
adminRouter.delete('/:id', protect, requireRole('admin'), deleteBooking);

export { publicRouter, adminRouter };
