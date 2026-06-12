import Exhibition from '../models/Exhibition.js';
import Trail from '../models/Trail.js';
import Artifact from '../models/Artifact.js';
import { asyncHandler, ValidationError } from '../utils/errors.js';

// @desc    Global search across exhibitions, trails, and artifacts
// @route   GET /api/search?q=keyword&type=all|exhibition|trail|artifact
export const globalSearch = asyncHandler(async (req, res) => {
  const { q, type = 'all' } = req.query;

  if (!q || q.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const regex = new RegExp(q.trim(), 'i');
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const searchTypes = type === 'all'
    ? ['exhibition', 'trail', 'artifact']
    : [type];

  const promises = [];

  if (searchTypes.includes('exhibition')) {
    promises.push(
      Exhibition.find({
        status: 'published',
        $or: [
          { 'title.en': regex },
          { 'title.fr': regex },
          { 'title.rw': regex },
          { 'shortDescription.en': regex },
          { tags: regex },
        ],
      })
        .select('title shortDescription coverImage tags')
        .limit(limit)
        .lean()
        .then(items => items.map(item => ({
          type: 'exhibition',
          _id: item._id,
          title: item.title,
          description: item.shortDescription,
          image: item.coverImage,
          link: `/exhibitions/${item._id}`,
        })))
    );
  }

  if (searchTypes.includes('trail')) {
    promises.push(
      Trail.find({
        isActive: true,
        $or: [
          { 'title.en': regex },
          { 'title.fr': regex },
          { 'title.rw': regex },
          { 'description.en': regex },
          { tags: regex },
        ],
      })
        .select('title description coverImage tags')
        .limit(limit)
        .lean()
        .then(items => items.map(item => ({
          type: 'trail',
          _id: item._id,
          title: item.title,
          description: item.description,
          image: item.coverImage,
          link: `/trails/${item._id}`,
        })))
    );
  }

  if (searchTypes.includes('artifact')) {
    promises.push(
      Artifact.find({
        status: 'published',
        $or: [
          { 'title.en': regex },
          { 'title.fr': regex },
          { 'title.rw': regex },
          { 'description.en': regex },
          { tags: regex },
        ],
      })
        .select('title description coverImage type tags')
        .limit(limit)
        .lean()
        .then(items => items.map(item => ({
          type: 'artifact',
          _id: item._id,
          title: item.title,
          description: item.description,
          image: item.coverImage,
          artifactType: item.type,
          link: `/artifacts/${item._id}`,
        })))
    );
  }

  const allResults = await Promise.all(promises);
  const merged = allResults.flat();

  res.json({
    query: q,
    total: merged.length,
    results: merged,
  });
});
