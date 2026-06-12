import Story from '../models/Story.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
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

  const result = await paginateWithCount(Story, filter, req);
  res.json(result);
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
  const data = { ...req.body, createdBy: req.admin._id };

  if (req.files) {
    if (req.files.coverImage?.[0]) {
      const result = await uploadToCloudinary(req.files.coverImage[0].buffer, { folder: 'museum/stories' });
      data.coverImage = result.url;
    }
    if (req.files.narration?.[0]) {
      const result = await uploadToCloudinary(req.files.narration[0].buffer, {
        folder: 'museum/narrations', resource_type: 'video',
      });
      data.narration = data.narration || {};
      const lang = req.body.narrationLanguage || 'en';
      data.narration = { ...data.narration, [lang]: result.url };
    }
    if (req.files.media) {
      const uploads = await Promise.all(
        req.files.media.map(f => uploadToCloudinary(f.buffer, { folder: 'museum/stories', resource_type: 'auto' }))
      );
      data.media = uploads.map(u => u.url);
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
    if (req.files.narration?.[0]) {
      const existingNarration = story.narration?.toObject?.() || story.narration || {};
      const result = await uploadToCloudinary(req.files.narration[0].buffer, {
        folder: 'museum/narrations', resource_type: 'video',
      });
      const lang = req.body.narrationLanguage || 'en';
      data.narration = { ...existingNarration, [lang]: result.url };
    }
    if (req.files.media) {
      const uploads = await Promise.all(
        req.files.media.map(f => uploadToCloudinary(f.buffer, { folder: 'museum/stories', resource_type: 'auto' }))
      );
      data.media = [
        ...(story.media || []),
        ...uploads.map(u => u.url),
      ];
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
