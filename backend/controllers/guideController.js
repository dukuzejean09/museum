import crypto from 'crypto';
import Guide from '../models/Guide.js';
import Admin from '../models/Admin.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { guide as guideSocket, user as userSocket } from '../utils/socketEmitter.js';
import { sendGuideWelcomeEmail, sendCredentialsEmail } from '../utils/email.js';

// @desc    Get all guides — paginated, filterable
// @route   GET /api/guides
export const getGuides = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.language) {
    filter.languages = { $in: [req.query.language] };
  }

  // For public requests, only show active guides
  if (!req.admin) {
    filter.isActive = true;
  }

  const result = await paginateWithCount(Guide, filter, req);
  res.json(result);
});

// @desc    Get guide by ID
// @route   GET /api/guides/:id
export const getGuideById = asyncHandler(async (req, res) => {
  const guide = await Guide.findById(req.params.id).lean();
  if (!guide) throw new NotFoundError('Guide');
  res.json(guide);
});

// @desc    Create guide (admin) — also creates a user account with guide role
// @route   POST /api/admin/guides
export const createGuide = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, { folder: 'museum/guides' });
    data.imageUrl = result.url;
  }
  if (typeof data.languages === 'string') {
    data.languages = data.languages.split(',').map((l) => l.trim());
  }
  if (typeof data.specializations === 'string') {
    data.specializations = data.specializations.split(',').map((s) => s.trim());
  }
  if (typeof data.availability === 'string') {
    try { data.availability = JSON.parse(data.availability); } catch { delete data.availability; }
  }

  // Auto-create a user account for this guide
  let adminUser = null;
  const guideEmail = data.email;
  if (guideEmail) {
    // Check if a user with this email already exists
    adminUser = await Admin.findOne({ email: guideEmail.toLowerCase().trim() });
  }

  if (!adminUser && guideEmail) {
    // Generate username from name (e.g. "Sylvie Umubyeyi" → "sylvie_umubyeyi")
    const nameParts = (data.name || 'guide').trim().toLowerCase().split(/\s+/);
    let baseUsername = nameParts.join('_').replace(/[^a-z0-9_]/g, '');
    if (baseUsername.length < 3) baseUsername = 'guide_' + baseUsername;

    // Ensure unique username
    let username = baseUsername;
    let counter = 1;
    while (await Admin.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    // Generate random password
    const password = crypto.randomBytes(4).toString('hex'); // 8 char hex

    // Send credentials email FIRST — only create account if email succeeds
    try {
      await sendCredentialsEmail({
        name: data.name,
        email: guideEmail,
        username,
        password,
        role: 'guide',
      });
    } catch (err) {
      console.error('Failed to send guide credentials email:', err.message);
      return res.status(500).json({ message: 'Failed to send credentials email. Guide was not created. Please check email configuration and try again.' });
    }

    adminUser = await Admin.create({
      username,
      email: guideEmail.toLowerCase().trim(),
      password,
      role: 'guide',
      profile: {
        firstName: nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : '',
        lastName: nameParts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        phone: data.phone || '',
      },
    });
    userSocket.created(adminUser);
  }

  // Link guide to user account
  if (adminUser) {
    data.userId = adminUser._id;
  }

  const guide = await Guide.create(data);
  guideSocket.created(guide);

  res.status(201).json(guide);
});

// @desc    Update guide (admin)
// @route   PUT /api/admin/guides/:id
export const updateGuide = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, { folder: 'museum/guides' });
    data.imageUrl = result.url;
  }
  if (typeof data.languages === 'string') {
    data.languages = data.languages.split(',').map((l) => l.trim());
  }
  if (typeof data.specializations === 'string') {
    data.specializations = data.specializations.split(',').map((s) => s.trim());
  }
  if (typeof data.availability === 'string') {
    try { data.availability = JSON.parse(data.availability); } catch { delete data.availability; }
  }
  const guide = await Guide.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!guide) throw new NotFoundError('Guide');
  guideSocket.updated(guide);
  res.json(guide);
});

// @desc    Delete guide (admin) — also deletes the linked user account
// @route   DELETE /api/admin/guides/:id
export const deleteGuide = asyncHandler(async (req, res) => {
  const guide = await Guide.findByIdAndDelete(req.params.id);
  if (!guide) throw new NotFoundError('Guide');

  // Also delete the linked user account
  if (guide.userId) {
    const user = await Admin.findById(guide.userId);
    if (user && !user.isProtected) {
      await user.deleteOne();
      userSocket.deleted(guide.userId);
    }
  }

  guideSocket.deleted(req.params.id);
  res.json({ message: 'Guide removed' });
});

// @desc    Get own guide profile (guide self-service)
// @route   GET /api/guide/profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const guide = await Guide.findOne({ userId: req.admin._id }).lean();
  if (!guide) throw new NotFoundError('Guide profile');
  res.json(guide);
});

// @desc    Update own guide profile (guide self-service)
// @route   PUT /api/guide/profile
export const updateMyProfile = asyncHandler(async (req, res) => {
  const guide = await Guide.findOne({ userId: req.admin._id });
  if (!guide) throw new NotFoundError('Guide profile');

  const data = { ...req.body };
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, { folder: 'museum/guides' });
    data.imageUrl = result.url;
  }
  if (typeof data.languages === 'string') {
    data.languages = data.languages.split(',').map((l) => l.trim());
  }
  if (typeof data.specializations === 'string') {
    data.specializations = data.specializations.split(',').map((s) => s.trim());
  }
  if (typeof data.availability === 'string') {
    try {
      data.availability = JSON.parse(data.availability);
    } catch {
      delete data.availability;
    }
  }

  // Only allow guides to update certain fields (not isActive, rating, etc.)
  const allowed = ['name', 'bio', 'languages', 'specializations', 'phone', 'email', 'availability', 'imageUrl'];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }

  const updated = await Guide.findByIdAndUpdate(guide._id, updates, { new: true });
  guideSocket.updated(updated);
  res.json(updated);
});
