import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import AccessCode from '../models/AccessCode.js';
import { asyncHandler, NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { accessCode as accessCodeSocket } from '../utils/socketEmitter.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Generate a random access code like "KM-A7F3X9B2"
const generateCode = () => {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KM-${hex}`;
};

// @desc    Generate a new access code (admin only)
// @route   POST /api/visitor/codes
export const generateAccessCode = asyncHandler(async (req, res) => {
  const { label, maxUses, expiresAt, type, duration, validFrom } = req.body;

  const code = generateCode();
  const accessCode = await AccessCode.create({
    code,
    label: label || '',
    maxUses: maxUses || null,
    expiresAt: expiresAt || null,
    type: type || 'physical',
    duration: duration || 3,
    validFrom: validFrom || null,
    createdBy: req.admin._id,
  });

  // Generate QR code encoding the gateway URL
  const gatewayUrl = `${FRONTEND_URL}/?code=${code}`;
  const qrCodeDataUrl = await QRCode.toDataURL(gatewayUrl, { width: 300, margin: 2 });

  accessCodeSocket.created(accessCode);
  res.status(201).json({
    _id: accessCode._id,
    code: accessCode.code,
    label: accessCode.label,
    type: accessCode.type,
    duration: accessCode.duration,
    maxUses: accessCode.maxUses,
    expiresAt: accessCode.expiresAt,
    qrCodeDataUrl,
    gatewayUrl,
  });
});

// @desc    Validate an access code and return a visitor JWT
// @route   POST /api/visitor/validate
export const validateAccessCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    throw new ValidationError('Access code is required');
  }

  // Use atomic findOneAndUpdate to increment timesUsed and log usage
  const now = new Date();
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || '';

  const accessCode = await AccessCode.findOneAndUpdate(
    {
      code: code.trim().toUpperCase(),
      isActive: true,
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      ],
      $expr: {
        $or: [
          { $eq: ['$maxUses', null] },
          { $lt: ['$timesUsed', '$maxUses'] },
        ],
      },
    },
    {
      $inc: { timesUsed: 1 },
      $push: {
        usageLog: { usedAt: now, ipAddress, userAgent },
      },
    },
    { new: true }
  );

  if (!accessCode) {
    // Try to find the code to give a more specific error
    const existing = await AccessCode.findOne({ code: code.trim().toUpperCase() });
    if (!existing) {
      throw new UnauthorizedError('Invalid access code');
    }
    if (!existing.isActive) {
      throw new UnauthorizedError('This access code has been deactivated');
    }
    if (existing.expiresAt && now > existing.expiresAt) {
      throw new UnauthorizedError('This access code has expired');
    }
    if (existing.maxUses !== null && existing.timesUsed >= existing.maxUses) {
      throw new UnauthorizedError('This access code has reached its usage limit');
    }
    throw new UnauthorizedError('Access code is not currently valid');
  }

  const tokenExpirySeconds = (accessCode.duration || 3) * 60 * 60;

  const token = jwt.sign(
    {
      type: 'visitor',
      codeId: accessCode._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: tokenExpirySeconds }
  );

  res.json({
    token,
    expiresIn: tokenExpirySeconds,
    type: accessCode.type,
  });
});

// @desc    List all access codes (admin only) — paginated, filterable
// @route   GET /api/visitor/codes
export const listAccessCodes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const result = await paginateWithCount(AccessCode, filter, req);

  // Populate createdBy
  const AccessCodeModel = AccessCode;
  const populatedData = await AccessCodeModel.populate(result.data, {
    path: 'createdBy',
    select: 'username',
  });

  res.json({ ...result, data: populatedData });
});

// @desc    Deactivate an access code (admin only)
// @route   PUT /api/visitor/codes/:id/deactivate
export const deactivateAccessCode = asyncHandler(async (req, res) => {
  const accessCode = await AccessCode.findById(req.params.id);
  if (!accessCode) throw new NotFoundError('Access code');

  accessCode.isActive = false;
  await accessCode.save();

  accessCodeSocket.deactivated(accessCode);
  res.json({ message: 'Access code deactivated', accessCode });
});
