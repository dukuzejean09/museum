import EvaluationResponse from '../models/EvaluationResponse.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { asyncHandler } from '../utils/errors.js';
import { evaluation as evaluationSocket } from '../utils/socketEmitter.js';

// @desc    Create evaluation response (public)
// @route   POST /api/evaluations
export const createEvaluation = asyncHandler(async (req, res) => {
  const { overallSatisfaction } = req.body;
  if (!overallSatisfaction) {
    return res.status(400).json({ message: 'Overall satisfaction rating is required' });
  }

  const evaluation = await EvaluationResponse.create(req.body);
  evaluationSocket.created(evaluation);
  res.status(201).json({ success: true, evaluation });
});

// @desc    List all evaluations (admin)
// @route   GET /api/admin/evaluations
export const getEvaluations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [evaluations, total] = await Promise.all([
    EvaluationResponse.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    EvaluationResponse.countDocuments(),
  ]);

  res.json({ evaluations, total, pages: Math.ceil(total / limit), page: Number(page) });
});

// @desc    Get evaluation stats (admin)
// @route   GET /api/admin/evaluations/stats
export const getEvaluationStats = asyncHandler(async (req, res) => {
  const [satisfactionStats, learningStats, monthlyTrends, arAnalytics] = await Promise.all([
    // Satisfaction averages
    EvaluationResponse.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgOverall: { $avg: '$overallSatisfaction' },
          avgEaseOfUse: { $avg: '$easeOfUse' },
          avgNavigation: { $avg: '$navigationQuality' },
          avgAR: { $avg: '$arUsefulness' },
          avgAudio: { $avg: '$audioUsefulness' },
          avgContent: { $avg: '$contentQuality' },
          recommendCount: { $sum: { $cond: ['$wouldRecommend', 1, 0] } },
        },
      },
    ]),
    // Learning impact percentages
    EvaluationResponse.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          arImproved: { $sum: { $cond: ['$arImprovedUnderstanding', 1, 0] } },
          narrationImproved: { $sum: { $cond: ['$narrationImprovedLearning', 1, 0] } },
          infoEasier: { $sum: { $cond: ['$informationEasierToAccess', 1, 0] } },
        },
      },
    ]),
    // Monthly trends (last 12 months)
    EvaluationResponse.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$overallSatisfaction' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // AR analytics from AnalyticsEvent
    AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: { $in: ['ar_scan', 'ar_recognition_success', 'ar_recognition_failure'] },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const satisfaction = satisfactionStats[0] || {};
  const learning = learningStats[0] || {};
  const total = satisfaction.total || 0;
  const learningTotal = learning.total || 0;

  // AR recognition method distribution
  const methodDist = await AnalyticsEvent.aggregate([
    { $match: { eventType: 'ar_recognition_success', 'metadata.recognitionMethod': { $exists: true } } },
    { $group: { _id: '$metadata.recognitionMethod', count: { $sum: 1 } } },
  ]);

  const arStats = {};
  arAnalytics.forEach((a) => { arStats[a._id] = a.count; });

  res.json({
    satisfaction: {
      total,
      avgOverall: round(satisfaction.avgOverall),
      avgEaseOfUse: round(satisfaction.avgEaseOfUse),
      avgNavigation: round(satisfaction.avgNavigation),
      avgAR: round(satisfaction.avgAR),
      avgAudio: round(satisfaction.avgAudio),
      avgContent: round(satisfaction.avgContent),
      recommendRate: total > 0 ? Math.round((satisfaction.recommendCount / total) * 100) : 0,
    },
    learningImpact: {
      total: learningTotal,
      arImprovedPercent: pct(learning.arImproved, learningTotal),
      narrationImprovedPercent: pct(learning.narrationImproved, learningTotal),
      infoEasierPercent: pct(learning.infoEasier, learningTotal),
    },
    monthlyTrends,
    ar: {
      totalScans: arStats.ar_scan || 0,
      successCount: arStats.ar_recognition_success || 0,
      failureCount: arStats.ar_recognition_failure || 0,
      successRate: arStats.ar_scan > 0
        ? Math.round(((arStats.ar_recognition_success || 0) / arStats.ar_scan) * 100)
        : 0,
      methodDistribution: methodDist.reduce((acc, m) => { acc[m._id] = m.count; return acc; }, {}),
    },
  });
});

// @desc    Export all evaluations (admin)
// @route   GET /api/admin/evaluations/export
export const exportEvaluations = asyncHandler(async (req, res) => {
  const evaluations = await EvaluationResponse.find().sort({ createdAt: -1 }).lean();
  res.json(evaluations);
});

// @desc    Delete evaluation (admin)
// @route   DELETE /api/admin/evaluations/:id
export const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await EvaluationResponse.findByIdAndDelete(req.params.id);
  if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
  res.json({ success: true, message: 'Evaluation deleted' });
});

function round(val) {
  return Math.round((val || 0) * 10) / 10;
}

function pct(count, total) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}
