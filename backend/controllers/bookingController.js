import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import Booking from '../models/Booking.js';
import Guide from '../models/Guide.js';
import AccessCode from '../models/AccessCode.js';
import { asyncHandler, NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { sendBookingConfirmation, sendBookingConfirmationWithCode } from '../utils/email.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const generateCode = () => {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KM-${hex}`;
};

// @desc    Create a booking (public) — physical tour or online access request
// @route   POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const { visitType, guideId, visitorName, visitorEmail, date, time, groupSize } = req.body;

  if (!visitorName || !visitorEmail || !date) {
    throw new ValidationError('Name, email, and date are required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(visitorEmail)) {
    throw new ValidationError('Invalid email format');
  }

  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    throw new ValidationError('Booking date cannot be in the past');
  }

  const type = visitType || 'physical';

  // Physical tour requires guide and time
  if (type === 'physical') {
    if (!guideId || !time) {
      throw new ValidationError('Guide and time are required for physical tours');
    }

    // Check for guide conflicts
    const existingBooking = await Booking.findOne({
      guideId,
      date: bookingDate,
      time,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingBooking) {
      throw new ConflictError('This guide is already booked at the requested date and time');
    }
  }

  const size = Number(groupSize) || 1;
  if (size < 1 || size > 50) {
    throw new ValidationError('Group size must be between 1 and 50');
  }

  const booking = await Booking.create({
    ...req.body,
    visitType: type,
    visitorName: visitorName.trim(),
    visitorEmail: visitorEmail.toLowerCase().trim(),
    groupSize: size,
  });

  // Send confirmation email for physical tours (non-blocking)
  if (type === 'physical' && guideId) {
    const guide = await Guide.findById(guideId).lean();
    sendBookingConfirmation(booking, guide).catch(err => {
      console.error('Failed to send booking confirmation email:', err.message);
    });
  }

  res.status(201).json(booking);
});

// @desc    Get all bookings — paginated, filterable
// @route   GET /api/admin/bookings
export const getBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.guideId) filter.guideId = req.query.guideId;
  if (req.query.visitType) filter.visitType = req.query.visitType;

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const result = await paginateWithCount(Booking, filter, req);

  const populatedData = await Booking.populate(result.data, [
    { path: 'guideId', select: 'name imageUrl' },
    { path: 'accessCodeId', select: 'code isActive timesUsed maxUses expiresAt' },
  ]);

  res.json({ ...result, data: populatedData });
});

// @desc    Update booking status + generate access code if confirming an online booking
// @route   PUT /api/admin/bookings/:id
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];

  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new NotFoundError('Booking');

  booking.status = status;

  if (status === 'rejected' && rejectionReason) {
    booking.rejectionReason = rejectionReason;
  }

  if (status === 'confirmed') {
    booking.confirmationSentAt = new Date();

    // Auto-generate access code for ALL confirmed bookings that don't have one
    if (!booking.accessCodeId) {
      const code = generateCode();
      const accessDuration = req.body.duration || 3; // hours (default 3h)
      // Code expires 1 month from now (or custom expiresAt from request)
      const codeExpiresAt = req.body.codeExpiresAt
        ? new Date(req.body.codeExpiresAt)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      const accessCode = await AccessCode.create({
        code,
        label: `${booking.visitType === 'online' ? 'Online' : 'Tour'} booking ${booking.referenceNumber}`,
        type: booking.visitType === 'online' ? 'virtual' : 'physical',
        duration: accessDuration,
        maxUses: booking.groupSize || 1,
        expiresAt: codeExpiresAt,
        createdBy: req.admin._id,
      });
      booking.accessCodeId = accessCode._id;
    }
  }

  await booking.save();

  // Populate for response
  await booking.populate([
    { path: 'guideId', select: 'name imageUrl' },
    { path: 'accessCodeId', select: 'code isActive timesUsed maxUses expiresAt duration' },
  ]);

  // Build response with QR if access code was generated
  const response = booking.toObject();
  if (status === 'confirmed' && booking.accessCodeId) {
    const gatewayUrl = `${FRONTEND_URL}/enter?code=${booking.accessCodeId.code}`;
    response.qrCodeDataUrl = await QRCode.toDataURL(gatewayUrl, { width: 300, margin: 2 });
    response.gatewayUrl = gatewayUrl;
  }

  // Send confirmation email with access code for all confirmed bookings
  if (status === 'confirmed') {
    const guide = booking.visitType === 'physical' && booking.guideId
      ? await Guide.findById(booking.guideId).lean()
      : null;
    const gatewayUrl = booking.accessCodeId
      ? `${FRONTEND_URL}/enter?code=${booking.accessCodeId.code}`
      : null;

    sendBookingConfirmationWithCode(booking, guide, {
      code: booking.accessCodeId?.code,
      gatewayUrl,
      duration: booking.accessCodeId?.duration,
      expiresAt: booking.accessCodeId?.expiresAt,
    }).catch(err => {
      console.error('Failed to send booking confirmation email:', err.message);
    });
  }

  res.json(response);
});

// @desc    Generate access code for a specific booking (admin/guide action)
// @route   POST /api/admin/bookings/:id/access-code
export const generateBookingAccessCode = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new NotFoundError('Booking');

  if (booking.accessCodeId) {
    throw new ValidationError('This booking already has an access code');
  }

  const code = generateCode();
  const accessDuration = req.body.duration || 3;
  const codeExpiresAt = req.body.codeExpiresAt
    ? new Date(req.body.codeExpiresAt)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

  const accessCode = await AccessCode.create({
    code,
    label: `Booking ${booking.referenceNumber} — ${booking.visitorName}`,
    type: booking.visitType === 'online' ? 'virtual' : 'physical',
    duration: accessDuration,
    maxUses: req.body.maxUses || booking.groupSize || 1,
    expiresAt: codeExpiresAt,
    createdBy: req.admin._id,
  });

  booking.accessCodeId = accessCode._id;
  if (booking.status === 'pending') {
    booking.status = 'confirmed';
    booking.confirmationSentAt = new Date();
  }
  await booking.save();

  const gatewayUrl = `${FRONTEND_URL}/enter?code=${code}`;
  const qrCodeDataUrl = await QRCode.toDataURL(gatewayUrl, { width: 300, margin: 2 });

  // Send confirmation email with access code
  const guide = booking.visitType === 'physical' && booking.guideId
    ? await Guide.findById(booking.guideId).lean()
    : null;

  sendBookingConfirmationWithCode(booking, guide, {
    code: accessCode.code,
    gatewayUrl,
    duration: accessCode.duration,
    expiresAt: accessCode.expiresAt,
  }).catch(err => {
    console.error('Failed to send booking confirmation email:', err.message);
  });

  res.status(201).json({
    booking: booking.toObject(),
    accessCode: {
      _id: accessCode._id,
      code: accessCode.code,
      type: accessCode.type,
      duration: accessCode.duration,
      maxUses: accessCode.maxUses,
      expiresAt: accessCode.expiresAt,
    },
    qrCodeDataUrl,
    gatewayUrl,
  });
});

// @desc    Cancel booking by reference number + email (public)
// @route   POST /api/bookings/cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const { referenceNumber, email } = req.body;

  if (!referenceNumber || !email) {
    throw new ValidationError('Reference number and email are required');
  }

  const booking = await Booking.findOne({
    referenceNumber: referenceNumber.trim().toUpperCase(),
    visitorEmail: email.toLowerCase().trim(),
  });

  if (!booking) throw new NotFoundError('Booking');

  if (['cancelled', 'completed'].includes(booking.status)) {
    throw new ValidationError(`Booking is already ${booking.status}`);
  }

  booking.status = 'cancelled';
  await booking.save();

  res.json({ message: 'Booking cancelled successfully', booking });
});

// @desc    Delete booking (admin)
// @route   DELETE /api/admin/bookings/:id
export const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) throw new NotFoundError('Booking');
  res.json({ message: 'Booking removed' });
});
