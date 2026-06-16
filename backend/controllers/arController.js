import Artifact from '../models/Artifact.js';
import Exhibition from '../models/Exhibition.js';
import { asyncHandler } from '../utils/errors.js';
import {
  loadAllDescriptors,
  saveDescriptor,
  deleteDescriptor,
  validateDescriptors,
} from '../services/descriptors/descriptorService.js';

// @desc    Get all OpenCV descriptors for client-side matching
// @route   GET /api/ar/descriptors
export const getDescriptors = asyncHandler(async (req, res) => {
  const { type } = req.query; // 'artifact', 'exhibition', or omit for all
  const descriptors = await loadAllDescriptors(type || null);
  res.json({ descriptors, count: descriptors.length });
});

// @desc    Rebuild descriptors for all published artifacts/exhibitions
// @route   POST /api/admin/ar/descriptors/rebuild
export const rebuildDescriptors = asyncHandler(async (req, res) => {
  // This endpoint signals the frontend or YOLO service to regenerate descriptors.
  // For now, it returns the list of entities that need descriptors generated.
  const [artifacts, exhibitions] = await Promise.all([
    Artifact.find({ status: 'published', image: { $exists: true, $ne: '' } }, '_id name image').lean(),
    Exhibition.find({ status: 'published', coverImage: { $exists: true, $ne: '' } }, '_id title coverImage').lean(),
  ]);

  const entities = [
    ...artifacts.map(a => ({ type: 'artifact', id: a._id.toString(), name: a.name?.en, image: a.image })),
    ...exhibitions.map(e => ({ type: 'exhibition', id: e._id.toString(), name: e.title?.en, image: e.coverImage })),
  ];

  res.json({
    message: `Found ${entities.length} entities needing descriptors`,
    entities,
    artifactCount: artifacts.length,
    exhibitionCount: exhibitions.length,
  });
});

// @desc    Validate descriptors — remove orphaned ones
// @route   POST /api/admin/ar/descriptors/validate
export const validateDescriptorsEndpoint = asyncHandler(async (req, res) => {
  const getValidIds = async () => {
    const [artifacts, exhibitions] = await Promise.all([
      Artifact.find({ status: 'published' }, '_id').lean(),
      Exhibition.find({ status: 'published' }, '_id').lean(),
    ]);
    const ids = new Set();
    artifacts.forEach(a => ids.add(`artifact_${a._id}`));
    exhibitions.forEach(e => ids.add(`exhibition_${e._id}`));
    return ids;
  };

  const removed = await validateDescriptors(getValidIds);
  res.json({ message: `Validation complete. Removed ${removed.length} orphaned descriptors.`, removed });
});

// @desc    Upload descriptor data for a specific entity
// @route   POST /api/admin/ar/descriptors/upload
export const uploadDescriptor = asyncHandler(async (req, res) => {
  const { entityType, entityId, keypoints, descriptors: desc, imageHash } = req.body;

  if (!entityType || !entityId) {
    return res.status(400).json({ message: 'entityType and entityId are required' });
  }

  const data = await saveDescriptor(entityType, entityId, {
    keypoints,
    descriptors: desc,
    imageHash,
  });

  res.json({ message: 'Descriptor saved', data });
});
