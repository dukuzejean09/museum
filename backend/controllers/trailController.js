import Trail from '../models/Trail.js';
import { asyncHandler, NotFoundError, ValidationError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { trail as trailSocket } from '../utils/socketEmitter.js';

// @desc    Get trails — paginated, filterable
// @route   GET /api/trails
export const getTrails = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isFeatured === 'true') filter.isFeatured = true;

  if (!req.admin) {
    filter.isActive = true;
  } else if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  const result = await paginateWithCount(Trail, filter, req);

  // Populate artifact info for stops
  if (result.data.length > 0) {
    const Artifact = (await import('../models/Artifact.js')).default;
    const allArtifactIds = [...new Set(
      result.data.flatMap(t => (t.stops || []).map(s => s.artifactId?.toString()).filter(Boolean))
    )];
    const artifacts = await Artifact.find({ _id: { $in: allArtifactIds } })
      .select('name image additionalImages')
      .lean();
    const artMap = Object.fromEntries(artifacts.map(a => [a._id.toString(), a]));

    result.data = result.data.map(t => ({
      ...(t.toObject ? t.toObject() : t),
      stops: (t.stops || []).map(s => ({
        ...(s.toObject ? s.toObject() : s),
        artifact: artMap[s.artifactId?.toString()] || null,
      })),
      stopCount: t.stops?.length || 0,
    }));
  }

  res.json(result);
});

// @desc    Get featured trails (public homepage)
// @route   GET /api/trails/featured
export const getFeaturedTrails = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 6, 20);
  const filter = { isFeatured: true, isActive: true };

  const trails = await Trail.find(filter)
    .sort({ priority: -1, 'stats.views': -1, createdAt: -1 })
    .limit(limit)
    .lean();

  // Populate all stop artifacts for slideshow preview
  const Artifact = (await import('../models/Artifact.js')).default;
  const allArtifactIds = [...new Set(
    trails.flatMap(t => (t.stops || []).map(s => s.artifactId?.toString()).filter(Boolean))
  )];
  const artifacts = await Artifact.find({ _id: { $in: allArtifactIds } })
    .select('name image')
    .lean();
  const artMap = Object.fromEntries(artifacts.map(a => [a._id.toString(), a]));

  trails.forEach(t => {
    t.stopCount = t.stops?.length || 0;
    (t.stops || []).forEach(s => {
      if (s.artifactId) {
        s.artifact = artMap[s.artifactId.toString()] || null;
      }
    });
  });

  res.json(trails);
});

// @desc    Get trail by ID (populate stops with artifacts)
// @route   GET /api/trails/:id
export const getTrailById = asyncHandler(async (req, res) => {
  const trail = await Trail.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'stats.views': 1 } },
    { new: true }
  ).lean();

  if (!trail) throw new NotFoundError('Trail');

  // Populate artifacts for each stop
  const Artifact = (await import('../models/Artifact.js')).default;
  const artifactIds = (trail.stops || []).map(s => s.artifactId).filter(Boolean);
  const artifacts = await Artifact.find({ _id: { $in: artifactIds } }).lean();
  const artMap = Object.fromEntries(artifacts.map(a => [a._id.toString(), a]));

  trail.stops = (trail.stops || []).map(s => ({
    ...s,
    artifact: artMap[s.artifactId?.toString()] || null,
  }));

  res.json(trail);
});

// Helper: normalise incoming body (parse stops JSON, tags, booleans, numbers)
const normaliseTrailBody = (body) => {
  const data = { ...body };

  // Parse stops if sent as JSON string
  if (typeof data.stops === 'string') {
    try { data.stops = JSON.parse(data.stops); } catch { data.stops = []; }
  }

  // Clean up stops — remove empty artifactId strings that fail ObjectId cast
  if (Array.isArray(data.stops)) {
    data.stops = data.stops.map(s => {
      if (s.artifactId === '' || s.artifactId === null) {
        const { artifactId, ...rest } = s;
        return rest;
      }
      return s;
    });
  }

  // Parse tags if sent as JSON string
  if (typeof data.tags === 'string') {
    try {
      const parsed = JSON.parse(data.tags);
      if (Array.isArray(parsed)) data.tags = parsed;
    } catch {
      // might be comma-separated
      data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  // Booleans
  if (typeof data.isFeatured === 'string') data.isFeatured = data.isFeatured === 'true';
  if (typeof data.isActive === 'string') data.isActive = data.isActive === 'true';

  // Numbers
  if (data.estimatedMinutes !== undefined) data.estimatedMinutes = Number(data.estimatedMinutes) || 30;

  return data;
};

// @desc    Create trail
// @route   POST /api/admin/trails
export const createTrail = asyncHandler(async (req, res) => {
  const data = { ...normaliseTrailBody(req.body), createdBy: req.admin._id };

  if (req.files) {
    if (req.files.coverImage?.[0]) {
      const result = await uploadToCloudinary(req.files.coverImage[0].buffer, { folder: 'museum/trails' });
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

  const trail = await Trail.create(data);
  trailSocket.created(trail);
  res.status(201).json(trail);
});

// @desc    Update trail
// @route   PUT /api/admin/trails/:id
export const updateTrail = asyncHandler(async (req, res) => {
  const trail = await Trail.findById(req.params.id);
  if (!trail) throw new NotFoundError('Trail');

  const data = normaliseTrailBody(req.body);

  if (req.files) {
    if (req.files.coverImage?.[0]) {
      const result = await uploadToCloudinary(req.files.coverImage[0].buffer, { folder: 'museum/trails' });
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

  Object.assign(trail, data);
  await trail.save();
  trailSocket.updated(trail);
  res.json(trail);
});

// @desc    Delete trail
// @route   DELETE /api/admin/trails/:id
export const deleteTrail = asyncHandler(async (req, res) => {
  const trail = await Trail.findById(req.params.id);
  if (!trail) throw new NotFoundError('Trail');
  await Trail.findByIdAndDelete(req.params.id);
  trailSocket.deleted(req.params.id);
  res.json({ message: 'Trail removed' });
});
