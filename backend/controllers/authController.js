import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { asyncHandler, NotFoundError, ValidationError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { sendCredentialsEmail } from '../utils/email.js';

/**
 * Generate a fingerprint hash from the request to bind JWT to client.
 * Combines User-Agent + IP to prevent stolen token reuse from different machines.
 */
const generateFingerprint = (req) => {
  const ua = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection?.remoteAddress || '';
  return crypto.createHash('sha256').update(`${ua}|${ip}`).digest('hex').slice(0, 16);
};

/**
 * Generate JWT with fingerprint binding and unique jti to prevent replay attacks.
 * Token expires in 1 day (reduced from 7d for security).
 */
const generateToken = (id, req) => {
  const fingerprint = generateFingerprint(req);
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { id, fp: fingerprint, jti },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

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
    token: generateToken(admin._id, req),
  });
});

/**
 * Validate Rwandan phone number.
 * Accepted formats: +250 7XX XXX XXX, 07XX XXX XXX, 7XX XXX XXX
 * Valid prefixes after country code: 72, 73, 78, 79 (MTN, Airtel, etc.)
 */
const isValidRwandanPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  // +250 7[2389] XXXXXXX  or  07[2389] XXXXXXX  or  7[2389] XXXXXXX
  return /^(\+?250|0)?7[2389]\d{7}$/.test(cleaned);
};

// @desc    Register new user (admin or guide) — admin only
// @route   POST /api/auth/register
export const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password, role, profile } = req.body;

  // ── Required fields ──
  if (!username || !email || !password) {
    throw new ValidationError('Username, email, and password are required');
  }

  // ── Username validation ──
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
    throw new ValidationError('Username must be between 3 and 30 characters');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    throw new ValidationError('Username can only contain letters, numbers, and underscores');
  }

  // ── Email validation ──
  const trimmedEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new ValidationError('Invalid email format');
  }

  // ── Password validation ──
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }

  // ── Profile validation ──
  const profileData = profile || {};
  if (!profileData.firstName || !profileData.firstName.trim()) {
    throw new ValidationError('First name is required');
  }
  if (!profileData.lastName || !profileData.lastName.trim()) {
    throw new ValidationError('Last name is required');
  }
  if (profileData.firstName.trim().length > 50 || profileData.lastName.trim().length > 50) {
    throw new ValidationError('First name and last name must be under 50 characters');
  }

  // ── Phone number validation (Rwandan) ──
  if (!profileData.phone || !profileData.phone.trim()) {
    throw new ValidationError('Phone number is required');
  }
  if (!isValidRwandanPhone(profileData.phone)) {
    throw new ValidationError('Invalid Rwandan phone number. Use format: 07XXXXXXXX or +2507XXXXXXXX (valid prefixes: 72, 73, 78, 79)');
  }

  // ── Check duplicates ──
  const existsByEmail = await Admin.findOne({ email: trimmedEmail });
  if (existsByEmail) {
    throw new ConflictError('An account with this email already exists');
  }
  const existsByUsername = await Admin.findOne({ username: trimmedUsername });
  if (existsByUsername) {
    throw new ConflictError('An account with this username already exists');
  }

  const validRoles = ['admin', 'guide'];
  const assignedRole = validRoles.includes(role) ? role : 'admin';

  const admin = await Admin.create({
    username: trimmedUsername,
    email: trimmedEmail,
    password,
    role: assignedRole,
    profile: {
      firstName: profileData.firstName.trim(),
      lastName: profileData.lastName.trim(),
      phone: profileData.phone.replace(/[\s\-().]/g, ''),
    },
  });

  // Send credentials email (non-blocking)
  sendCredentialsEmail({
    name: `${profileData.firstName.trim()} ${profileData.lastName.trim()}`,
    email: trimmedEmail,
    username: trimmedUsername,
    password, // plain text — before hashing
    role: assignedRole,
  }).catch(err => {
    console.error('Failed to send credentials email:', err.message);
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
