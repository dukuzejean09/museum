import Exhibition from '../models/Exhibition.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

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

// @desc    Get exhibition by ID (populate artifacts for images)
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
// NOTE: No image uploads — exhibitions get images from linked artifacts.
//       Only audio narration and video URLs are supported.
export const createExhibition = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.admin._id };

  // Handle audio/video uploads to Cloudinary
  if (req.files) {
    if (req.files.narrationFull?.[0]) {
      const result = await uploadToCloudinary(req.files.narrationFull[0].buffer, {
        folder: 'museum/narrations', resource_type: 'video',
      });
      data.narration = data.narration || {};
      data.narration.full = data.narration.full || {};
      const lang = req.body.narrationFullLang || 'en';
      data.narration.full[lang] = result.url;
    }
    if (req.files.narrationPreview?.[0]) {
      const result = await uploadToCloudinary(req.files.narrationPreview[0].buffer, {
        folder: 'museum/narrations', resource_type: 'video',
      });
      data.narration = data.narration || {};
      data.narration.preview = data.narration.preview || {};
      const lang = req.body.narrationPreviewLang || 'en';
      data.narration.preview[lang] = result.url;
    }
    if (req.files.videos) {
      const uploads = await Promise.all(
        req.files.videos.map(f => uploadToCloudinary(f.buffer, { folder: 'museum/videos', resource_type: 'video' }))
      );
      data.media = data.media || {};
      data.media.videos = uploads.map(u => u.url);
    }
  }

  // Parse artifacts array if sent as JSON string
  if (typeof data.artifacts === 'string') {
    try { data.artifacts = JSON.parse(data.artifacts); } catch { /* keep as-is */ }
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

  // Handle audio/video uploads to Cloudinary
  if (req.files) {
    if (req.files.narrationFull?.[0]) {
      const result = await uploadToCloudinary(req.files.narrationFull[0].buffer, {
        folder: 'museum/narrations', resource_type: 'video',
      });
      data.narration = data.narration || exhibition.narration?.toObject?.() || {};
      data.narration.full = data.narration.full || {};
      const lang = req.body.narrationFullLang || 'en';
      data.narration.full[lang] = result.url;
    }
    if (req.files.narrationPreview?.[0]) {
      const result = await uploadToCloudinary(req.files.narrationPreview[0].buffer, {
        folder: 'museum/narrations', resource_type: 'video',
      });
      data.narration = data.narration || exhibition.narration?.toObject?.() || {};
      data.narration.preview = data.narration.preview || {};
      const lang = req.body.narrationPreviewLang || 'en';
      data.narration.preview[lang] = result.url;
    }
    if (req.files.videos) {
      const uploads = await Promise.all(
        req.files.videos.map(f => uploadToCloudinary(f.buffer, { folder: 'museum/videos', resource_type: 'video' }))
      );
      data.media = data.media || exhibition.media?.toObject?.() || {};
      data.media.videos = [
        ...(exhibition.media?.videos || []),
        ...uploads.map(u => u.url),
      ];
    }
  }

  // Parse artifacts array if sent as JSON string
  if (typeof data.artifacts === 'string') {
    try { data.artifacts = JSON.parse(data.artifacts); } catch { /* keep as-is */ }
  }

  Object.assign(exhibition, data);
  await exhibition.save();
  res.json(exhibition);
});

// @desc    Delete exhibition (admin only) — cascades to stories
// @route   DELETE /api/admin/exhibitions/:id
export const deleteExhibition = asyncHandler(async (req, res) => {
  const exhibition = await Exhibition.findById(req.params.id);
  if (!exhibition) throw new NotFoundError('Exhibition');

  // Cascade: remove all stories linked to this exhibition
  const Story = (await import('../models/Story.js')).default;
  await Story.deleteMany({ exhibitionId: exhibition._id });

  await Exhibition.findByIdAndDelete(req.params.id);
  res.json({ message: 'Exhibition and related stories removed' });
});

// @desc    Get featured exhibitions (for homepage)
// @route   GET /api/exhibitions/featured
export const getFeaturedExhibitions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 6, 20);
  const filter = { status: 'published' };

  const exhibitions = await Exhibition.find(filter)
    .populate('artifacts', 'name image additionalImages')
    .sort({ 'stats.views': -1, createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(exhibitions);
});
