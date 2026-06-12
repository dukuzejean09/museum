import express from 'express';
import {
  loginAdmin, registerAdmin, getAdminProfile, changePassword,
  getUsers, updateUserRole, deleteUser, toggleUserStatus,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/register', protect, requireRole('admin'), registerAdmin);
router.get('/profile', protect, getAdminProfile);
router.put('/password', protect, changePassword);

// User management (admin only)
router.get('/users', protect, requireRole('admin'), getUsers);
router.put('/users/:id/role', protect, requireRole('admin'), updateUserRole);
router.put('/users/:id/status', protect, requireRole('admin'), toggleUserStatus);
router.delete('/users/:id', protect, requireRole('admin'), deleteUser);

export default router;
