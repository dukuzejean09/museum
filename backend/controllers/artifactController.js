import Artifact from '../models/Artifact.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { generateAudioForEntity } from '../jobs/audioGeneration.js';

// @desc    Get artifacts — paginated, filterable
// @route   GET /api/artifacts
export const getArtifacts = asyncHandler(async (req, res) => {
  const filter = {};

  if (!req.admin) {
    filter.status = 'published';
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.category) filter.category = req.query.category;

  const result = await paginateWithCount(Artifact, filter, req);
  res.json(result);
});

// @desc    Get artifact by ID
// @route   GET /api/artifacts/:id
export const getArtifactById = asyncHandler(async (req, res) => {
  const artifact = await Artifact.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'stats.views': 1 } },
    { new: true }
  ).lean();

  if (!artifact) throw new NotFoundError('Artifact');

  // Find related exhibitions and trails
  const Exhibition = (await import('../models/Exhibition.js')).default;
  const Trail = (await import('../models/Trail.js')).default;

  const [exhibitions, trails] = await Promise.all([
    Exhibition.find({ artifacts: artifact._id, status: 'published' })
      .select('title coverImage shortDescription')
      .lean(),
    Trail.find({ 'stops.artifactId': artifact._id, isActive: true })
      .select('title coverImage description')
      .lean(),
  ]);

  res.json({ ...artifact, exhibitions, trails });
});

// @desc    Create artifact
// @route   POST /api/admin/artifacts
export const createArtifact = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.admin._id };

  if (req.files) {
    if (req.files.image?.[0]) {
      const result = await uploadToCloudinary(req.files.image[0].buffer, { folder: 'museum/artifacts' });
      data.image = result.url;
    }
    if (req.files.additionalImages) {
      const uploads = await Promise.all(
        req.files.additionalImages.map(f => uploadToCloudinary(f.buffer, { folder: 'museum/artifacts' }))
      );
      data.additionalImages = uploads.map(u => u.url);
    }
  }

  const artifact = await Artifact.create(data);

  // Auto-generate narration audio in the background
  generateAudioForEntity('artifact', artifact._id).catch(() => {});

  res.status(201).json(artifact);
});

// @desc    Update artifact
// @route   PUT /api/admin/artifacts/:id
export const updateArtifact = asyncHandler(async (req, res) => {
  const artifact = await Artifact.findById(req.params.id);
  if (!artifact) throw new NotFoundError('Artifact');

  const data = { ...req.body };
  if (req.files) {
    if (req.files.image?.[0]) {
      const result = await uploadToCloudinary(req.files.image[0].buffer, { folder: 'museum/artifacts' });
      data.image = result.url;
    }
    if (req.files.additionalImages) {
      const uploads = await Promise.all(
        req.files.additionalImages.map(f => uploadToCloudinary(f.buffer, { folder: 'museum/artifacts' }))
      );
      data.additionalImages = [
        ...(artifact.additionalImages || []),
        ...uploads.map(u => u.url),
      ];
    }
  }

  Object.assign(artifact, data);
  await artifact.save();

  // Re-generate narration audio in the background
  generateAudioForEntity('artifact', artifact._id).catch(() => {});

  res.json(artifact);
});

// @desc    Delete artifact — cascades: remove from exhibitions and trail stops
// @route   DELETE /api/admin/artifacts/:id
export const deleteArtifact = asyncHandler(async (req, res) => {
  const artifact = await Artifact.findById(req.params.id);
  if (!artifact) throw new NotFoundError('Artifact');

  const Exhibition = (await import('../models/Exhibition.js')).default;
  const Trail = (await import('../models/Trail.js')).default;

  // Remove artifact reference from exhibitions
  await Exhibition.updateMany(
    { artifacts: artifact._id },
    { $pull: { artifacts: artifact._id } }
  );

  // Remove artifact from trail stops
  await Trail.updateMany(
    { 'stops.artifactId': artifact._id },
    { $pull: { stops: { artifactId: artifact._id } } }
  );

  await Artifact.findByIdAndDelete(req.params.id);
  res.json({ message: 'Artifact removed and references cleaned up' });
});
