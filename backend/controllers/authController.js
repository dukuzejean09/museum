import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { asyncHandler, NotFoundError, ValidationError, UnauthorizedError, ConflictError } from '../utils/errors.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @desc    Login admin
// @route   POST /api/auth/login
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

  if (!admin || !(await admin.matchPassword(password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!admin.isActive) {
    throw new UnauthorizedError('Account has been deactivated');
  }

  // Set last login
  admin.lastLoginAt = new Date();
  await admin.save();

  res.json({
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    profile: admin.profile,
    settings: admin.settings,
    token: generateToken(admin._id),
  });
});

// @desc    Register new user (admin or guide) — admin only
// @route   POST /api/auth/register
export const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password, role, profile } = req.body;

  if (!username || !email || !password) {
    throw new ValidationError('Username, email, and password are required');
  }
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }

  const exists = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    throw new ConflictError('An account with this email already exists');
  }

  const validRoles = ['admin', 'guide'];
  const assignedRole = validRoles.includes(role) ? role : 'admin';

  const admin = await Admin.create({
    username,
    email: email.toLowerCase().trim(),
    password,
    role: assignedRole,
    profile: profile || {},
  });

  res.status(201).json({
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    profile: admin.profile,
  });
});

// @desc    Get admin profile
// @route   GET /api/auth/profile
export const getAdminProfile = asyncHandler(async (req, res) => {
  res.json(req.admin);
});

// @desc    Change password
// @route   PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }
  if (newPassword.length < 6) {
    throw new ValidationError('New password must be at least 6 characters');
  }

  const admin = await Admin.findById(req.admin._id);
  if (!admin) throw new NotFoundError('Admin');

  const isMatch = await admin.matchPassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  admin.password = newPassword;
  await admin.save();

  res.json({ message: 'Password changed successfully' });
});

// @desc    Get all users (admins and guides)
// @route   GET /api/auth/users
export const getUsers = asyncHandler(async (req, res) => {
  const users = await Admin.find()
    .select('-password')
    .sort({ createdAt: -1 });

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    guides: users.filter((u) => u.role === 'guide').length,
  };

  res.json({ users, counts });
});

// @desc    Update user role
// @route   PUT /api/auth/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'guide'];

  if (!validRoles.includes(role)) {
    throw new ValidationError('Role must be admin or guide');
  }

  // Prevent admin from changing their own role
  if (req.params.id === req.admin._id.toString()) {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  const user = await Admin.findById(req.params.id);
  if (!user) throw new NotFoundError('User');

  // Prevent changing the protected (first) admin's role
  if (user.isProtected) {
    return res.status(403).json({ message: 'This account is protected and cannot be modified' });
  }

  user.role = role;
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.admin._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const user = await Admin.findById(req.params.id);
  if (!user) throw new NotFoundError('User');

  // Prevent deleting the protected (first) admin
  if (user.isProtected) {
    return res.status(403).json({ message: 'This account is protected and cannot be deleted' });
  }

  await user.deleteOne();

  res.json({ message: 'User deleted successfully' });
});

// @desc    Toggle user active status
// @route   PUT /api/auth/users/:id/status
export const toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.admin._id.toString()) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  const user = await Admin.findById(req.params.id);
  if (!user) throw new NotFoundError('User');

  // Prevent deactivating the protected (first) admin
  if (user.isProtected) {
    return res.status(403).json({ message: 'This account is protected and cannot be deactivated' });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    isActive: user.isActive,
  });
});
