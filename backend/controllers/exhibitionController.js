import Exhibition from '../models/Exhibition.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';

// @desc    Get exhibitions — paginated, filterable
// @route   GET /api/exhibitions
export const getExhibitions = asyncHandler(async (req, res) => {
  const filter = {};

  // Public requests only see published
  if (!req.admin) {
    filter.status = 'published';
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.tags) {
    filter.tags = { $in: req.query.tags.split(',').map(t => t.trim()) };
  }

  const result = await paginateWithCount(Exhibition, filter, req);
  res.json(result);
});

// @desc    Get exhibition by ID
// @route   GET /api/exhibitions/:id
export const getExhibitionById = asyncHandler(async (req, res) => {
  const exhibition = await Exhibition.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'stats.views': 1 } },
    { new: true }
  ).populate('artifacts').lean();

  if (!exhibition) throw new NotFoundError('Exhibition');
  res.json(exhibition);
});

// @desc    Create exhibition (admin/guide)
// @route   POST /api/admin/exhibitions
export const createExhibition = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.admin._id };

  // Handle file uploads
  if (req.files) {
    if (req.files.coverImage && req.files.coverImage[0]) {
      data.coverImage = `/uploads/${req.files.coverImage[0].filename}`;
    }
    if (req.files.images) {
      data.media = data.media || {};
      data.media.images = req.files.images.map(f => `/uploads/${f.filename}`);
    }
    if (req.files.narration) {
      data.narration = data.narration || {};
      const lang = req.body.narrationLanguage || 'en';
      data.narration = { ...data.narration, [lang]: `/uploads/${req.files.narration[0].filename}` };
    }
  }

  const exhibition = await Exhibition.create(data);
  res.status(201).json(exhibition);
});

// @desc    Update exhibition (admin/guide)
// @route   PUT /api/admin/exhibitions/:id
export const updateExhibition = asyncHandler(async (req, res) => {
  const exhibition = await Exhibition.findById(req.params.id);
  if (!exhibition) throw new NotFoundError('Exhibition');

  const data = { ...req.body };

  if (req.files) {
    if (req.files.coverImage && req.files.coverImage[0]) {
      data.coverImage = `/uploads/${req.files.coverImage[0].filename}`;
    }
    if (req.files.images) {
      if (!data.media) data.media = exhibition.media?.toObject?.() || {};
      data.media.images = [
        ...(exhibition.media?.images || []),
        ...req.files.images.map(f => `/uploads/${f.filename}`),
      ];
    }
  }

  Object.assign(exhibition, data);
  await exhibition.save();
  res.json(exhibition);
});

// @desc    Delete exhibition (admin only)
// @route   DELETE /api/admin/exhibitions/:id
export const deleteExhibition = asyncHandler(async (req, res) => {
  const exhibition = await Exhibition.findById(req.params.id);
  if (!exhibition) throw new NotFoundError('Exhibition');
  await Exhibition.findByIdAndDelete(req.params.id);
  res.json({ message: 'Exhibition removed' });
});

// @desc    Get featured exhibitions (for homepage)
// @route   GET /api/exhibitions/featured
export const getFeaturedExhibitions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 6, 20);
  const filter = { status: 'published' };

  const exhibitions = await Exhibition.find(filter)
    .sort({ 'stats.views': -1, createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(exhibitions);
});
