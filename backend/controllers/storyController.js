import Story from '../models/Story.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Get stories — paginated, filterable
// @route   GET /api/stories
export const getStories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.exhibitionId) filter.exhibitionId = req.query.exhibitionId;

  if (!req.admin) {
    filter.status = 'published';
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || '-createdAt';

  const [data, total] = await Promise.all([
    Story.find(filter).populate('exhibitionId', 'title').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Story.countDocuments(filter),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: page * limit < total },
  });
});

// @desc    Get story by ID
// @route   GET /api/stories/:id
export const getStoryById = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id)
    .populate('exhibitionId', 'title')
    .lean();

  if (!story) throw new NotFoundError('Story');
  res.json(story);
});

// @desc    Create story (admin/guide)
// @route   POST /api/admin/stories
export const createStory = asyncHandler(async (req, res) => {
  if (!req.body.exhibitionId) {
    return res.status(400).json({ message: 'Exhibition is required. Every story must belong to an exhibition.' });
  }
  const data = { ...req.body, createdBy: req.admin._id };

  if (req.files) {
    if (req.files.coverImage?.[0]) {
      const result = await uploadToCloudinary(req.files.coverImage[0].buffer, { folder: 'museum/stories' });
      data.coverImage = result.url;
    }
    if (req.files.audio?.[0]) {
      const result = await uploadToCloudinary(req.files.audio[0].buffer, { folder: 'museum/audio', resource_type: 'video' });
      data.audio = result.url;
    }
    if (req.files.video?.[0]) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, { folder: 'museum/video', resource_type: 'video' });
      data.video = result.url;
    }
  }

  const story = await Story.create(data);
  res.status(201).json(story);
});

// @desc    Update story (admin/guide)
// @route   PUT /api/admin/stories/:id
export const updateStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw new NotFoundError('Story');

  const data = { ...req.body };

  if (req.files) {
    if (req.files.coverImage?.[0]) {
      const result = await uploadToCloudinary(req.files.coverImage[0].buffer, { folder: 'museum/stories' });
      data.coverImage = result.url;
    }
    if (req.files.audio?.[0]) {
      const result = await uploadToCloudinary(req.files.audio[0].buffer, { folder: 'museum/audio', resource_type: 'video' });
      data.audio = result.url;
    }
    if (req.files.video?.[0]) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, { folder: 'museum/video', resource_type: 'video' });
      data.video = result.url;
    }
  }

  Object.assign(story, data);
  await story.save();
  res.json(story);
});

// @desc    Delete story (admin only)
// @route   DELETE /api/admin/stories/:id
export const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) throw new NotFoundError('Story');
  await Story.findByIdAndDelete(req.params.id);
  res.json({ message: 'Story removed' });
});
