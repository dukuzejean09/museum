import Message from '../models/Message.js';
import { asyncHandler, NotFoundError, ValidationError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { sendMessageReplyNotification } from '../utils/email.js';

// @desc    Create message (public, optionally linked to exhibition)
// @route   POST /api/messages
export const createMessage = asyncHandler(async (req, res) => {
  const { name, email, message, exhibitionId, priority, subject, language } = req.body;

  if (!name || !email || !message) {
    throw new ValidationError('Name, email, and message are required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (message.length > 5000) {
    throw new ValidationError('Message cannot exceed 5000 characters');
  }

  const newMessage = await Message.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    subject: subject || '',
    message: message.trim(),
    exhibitionId: exhibitionId || null,
    priority: priority || 'normal',
    language: language || 'en',
  });

  res.status(201).json({ success: true, message: 'Message sent!', data: newMessage });
});

// @desc    Get all messages — paginated, filterable
// @route   GET /api/admin/messages
export const getMessages = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.exhibitionId) filter.exhibitionId = req.query.exhibitionId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  const result = await paginateWithCount(Message, filter, req);

  const populatedData = await Message.populate(result.data, [
    { path: 'exhibitionId', select: 'title coverImage' },
    { path: 'assignedTo', select: 'username profile' },
  ]);

  res.json({ ...result, data: populatedData });
});

// @desc    Get message by ID
// @route   GET /api/admin/messages/:id
export const getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('exhibitionId', 'title coverImage')
    .populate('assignedTo', 'username profile');

  if (!message) throw new NotFoundError('Message');
  res.json(message);
});

// @desc    Reply to a message
// @route   POST /api/admin/messages/:id/reply
export const replyToMessage = asyncHandler(async (req, res) => {
  const { message: replyText } = req.body;
  if (!replyText || !replyText.trim()) {
    throw new ValidationError('Reply message is required');
  }

  const msg = await Message.findById(req.params.id);
  if (!msg) throw new NotFoundError('Message');

  const reply = {
    responderId: req.admin._id,
    responderName: req.admin.profile?.firstName
      ? `${req.admin.profile.firstName} ${req.admin.profile.lastName || ''}`.trim()
      : req.admin.username,
    responderRole: req.admin.role,
    message: replyText.trim(),
  };

  msg.replies.push(reply);
  msg.status = 'answered';
  await msg.save();

  // Send email notification (non-blocking)
  sendMessageReplyNotification(msg, reply).catch(err => {
    console.error('Failed to send reply notification email:', err.message);
  });

  res.json(msg);
});

// @desc    Assign message to a staff member
// @route   PUT /api/admin/messages/:id/assign
export const assignMessage = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  if (!assignedTo) throw new ValidationError('assignedTo (admin ID) is required');

  const msg = await Message.findById(req.params.id);
  if (!msg) throw new NotFoundError('Message');

  msg.assignedTo = assignedTo;
  if (msg.status === 'open') msg.status = 'in_progress';
  await msg.save();

  const populated = await Message.findById(msg._id)
    .populate('assignedTo', 'username profile');

  res.json(populated);
});

// @desc    Update message status
// @route   PUT /api/admin/messages/:id/status
export const updateMessageStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'in_progress', 'answered', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const msg = await Message.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!msg) throw new NotFoundError('Message');
  res.json(msg);
});

// @desc    Delete message (admin only)
// @route   DELETE /api/admin/messages/:id
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) throw new NotFoundError('Message');
  res.json({ message: 'Message removed' });
});
