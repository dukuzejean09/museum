import Survey from '../models/Survey.js';
import { asyncHandler, NotFoundError, ValidationError } from '../utils/errors.js';
import { paginateWithCount } from '../utils/pagination.js';

// @desc    Submit survey (public)
// @route   POST /api/surveys
export const createSurvey = asyncHandler(async (req, res) => {
  const { overallRating, comments, ratings, favoriteExhibition, favoriteExhibitionName, responses, language, visitorEmail } = req.body;

  if (!overallRating || overallRating < 1 || overallRating > 5) {
    throw new ValidationError('Overall rating (1-5) is required');
  }

  if (comments && comments.length > 2000) {
    throw new ValidationError('Comments cannot exceed 2000 characters');
  }

  const survey = await Survey.create({
    ...req.body,
    visitorName: req.body.visitorName?.trim() || '',
    visitorEmail: visitorEmail || '',
    overallRating: Number(overallRating),
    ratings: ratings || {},
    favoriteExhibition: favoriteExhibition || null,
    favoriteExhibitionName: favoriteExhibitionName || '',
    responses: responses || [],
    language: language || 'en',
  });

  res.status(201).json(survey);
});

// @desc    Get all surveys — paginated, filterable
// @route   GET /api/admin/surveys
export const getSurveys = asyncHandler(async (req, res) => {
  const filter = {};

  // Rating filter
  if (req.query.minRating) filter.overallRating = { $gte: Number(req.query.minRating) };
  if (req.query.maxRating) {
    filter.overallRating = { ...(filter.overallRating || {}), $lte: Number(req.query.maxRating) };
  }

  // Date range filter
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const result = await paginateWithCount(Survey, filter, req);

  // Populate favoriteExhibition
  const populatedData = await Survey.populate(result.data, {
    path: 'favoriteExhibition',
    select: 'title coverImage',
  });

  res.json({ ...result, data: populatedData });
});

// @desc    Get survey stats (aggregated)
// @route   GET /api/admin/surveys/stats
export const getSurveyStats = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
  }

  const pipeline = [
    ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgRating: { $avg: '$overallRating' },
        avgExhibitionsRating: { $avg: '$ratings.exhibitions' },
        avgStaffRating: { $avg: '$ratings.staff' },
        avgFacilitiesRating: { $avg: '$ratings.facilities' },
        avgAccessibilityRating: { $avg: '$ratings.accessibility' },
        recommendCount: { $sum: { $cond: ['$wouldRecommend', 1, 0] } },
      },
    },
  ];

  const [stats] = await Survey.aggregate(pipeline);

  if (!stats) {
    return res.json({
      total: 0,
      avgRating: 0,
      recommendRate: 0,
      durationBreakdown: {},
      categoryRatings: {},
    });
  }

  const recommendRate = Math.round((stats.recommendCount / stats.total) * 100);

  // Duration breakdown
  const durationPipeline = [
    ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
    { $match: { visitDuration: { $ne: null, $ne: '' } } },
    { $group: { _id: '$visitDuration', count: { $sum: 1 } } },
  ];
  const durationStats = await Survey.aggregate(durationPipeline);
  const durationBreakdown = {};
  durationStats.forEach(d => { durationBreakdown[d._id] = d.count; });

  res.json({
    total: stats.total,
    avgRating: Math.round((stats.avgRating || 0) * 10) / 10,
    recommendRate,
    durationBreakdown,
    categoryRatings: {
      exhibitions: Math.round((stats.avgExhibitionsRating || 0) * 10) / 10,
      staff: Math.round((stats.avgStaffRating || 0) * 10) / 10,
      facilities: Math.round((stats.avgFacilitiesRating || 0) * 10) / 10,
      accessibility: Math.round((stats.avgAccessibilityRating || 0) * 10) / 10,
    },
  });
});

// @desc    Delete survey (admin only)
// @route   DELETE /api/admin/surveys/:id
export const deleteSurvey = asyncHandler(async (req, res) => {
  const survey = await Survey.findByIdAndDelete(req.params.id);
  if (!survey) throw new NotFoundError('Survey');
  res.json({ message: 'Survey removed' });
});
