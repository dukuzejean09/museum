import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import Trail from '../models/Trail.js';
import Guide from '../models/Guide.js';
import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import Survey from '../models/Survey.js';
import Story from '../models/Story.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { asyncHandler } from '../utils/errors.js';

// @desc    Get comprehensive dashboard stats
// @route   GET /api/admin/analytics
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const countFilter = hasDateFilter ? { createdAt: dateFilter } : {};

  const [
    exhibitionCount,
    artifactCount,
    trailCount,
    guideCount,
    messageCount,
    bookingCount,
    surveyCount,
    storyCount,
    recentMessages,
    recentBookings,
    surveyStats,
  ] = await Promise.all([
    Exhibition.countDocuments(countFilter),
    Artifact.countDocuments(countFilter),
    Trail.countDocuments(countFilter),
    Guide.countDocuments(countFilter),
    Message.countDocuments(countFilter),
    Booking.countDocuments(countFilter),
    Survey.countDocuments(countFilter),
    Story.countDocuments(countFilter),
    Message.find().sort({ createdAt: -1 }).limit(5).lean(),
    Booking.find().sort({ createdAt: -1 }).limit(5).populate('guideId', 'name').lean(),
    Survey.aggregate([
      ...(hasDateFilter ? [{ $match: { createdAt: dateFilter } }] : []),
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$overallRating' },
          totalSurveys: { $sum: 1 },
          recommendCount: { $sum: { $cond: ['$wouldRecommend', 1, 0] } },
        },
      },
    ]),
  ]);

  // Trends: this month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthContent, lastMonthContent] = await Promise.all([
    Exhibition.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    Exhibition.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
  ]);

  const stats = surveyStats[0] || { avgRating: 0, totalSurveys: 0, recommendCount: 0 };
  const recommendRate = stats.totalSurveys > 0
    ? Math.round((stats.recommendCount / stats.totalSurveys) * 100)
    : 0;

  res.json({
    counts: {
      exhibitions: exhibitionCount,
      artifacts: artifactCount,
      trails: trailCount,
      guides: guideCount,
      messages: messageCount,
      bookings: bookingCount,
      surveys: surveyCount,
      stories: storyCount,
    },
    recent: {
      messages: recentMessages,
      bookings: recentBookings,
    },
    survey: {
      avgRating: Math.round((stats.avgRating || 0) * 10) / 10,
      recommendRate,
      total: stats.totalSurveys,
    },
    trends: {
      thisMonth: thisMonthContent,
      lastMonth: lastMonthContent,
    },
    // Flat fields for dashboard cards
    exhibitionCount,
    artifactCount,
    trailCount,
    guideCount,
    messageCount,
    bookingCount,
    surveyCount,
    storyCount,
    recentMessages,
    recentBookings,
  });
});

// @desc    Track an analytics event (public)
// @route   POST /api/analytics/track
export const trackEvent = asyncHandler(async (req, res) => {
  const { eventType, entityType, entityId, visitorId, metadata } = req.body;

  if (!eventType || !entityType || !entityId) {
    return res.status(400).json({ message: 'eventType, entityType, and entityId are required' });
  }

  const event = await AnalyticsEvent.create({
    eventType,
    entityType,
    entityId,
    visitorId: visitorId || null,
    metadata: metadata || {},
  });

  res.status(201).json({ success: true, eventId: event._id });
});

// @desc    Get content analytics (views/engagement per entity)
// @route   GET /api/admin/analytics/content
export const getContentAnalytics = asyncHandler(async (req, res) => {
  const { entityType, from, to } = req.query;
  const match = {};
  if (entityType) match.entityType = entityType;
  if (from || to) {
    match.timestamp = {};
    if (from) match.timestamp.$gte = new Date(from);
    if (to) match.timestamp.$lte = new Date(to);
  }

  const analytics = await AnalyticsEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: { entityType: '$entityType', entityId: '$entityId', eventType: '$eventType' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: { entityType: '$_id.entityType', entityId: '$_id.entityId' },
        events: {
          $push: { eventType: '$_id.eventType', count: '$count' },
        },
        totalEvents: { $sum: '$count' },
      },
    },
    { $sort: { totalEvents: -1 } },
    { $limit: 50 },
  ]);

  res.json(analytics);
});

// @desc    Get advanced analytics insights
// @route   GET /api/admin/analytics/insights
export const getAnalyticsInsights = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

  const [
    dailyVisitors,
    topArtifacts,
    topExhibitions,
    arMethodStats,
    engagementByDay,
    audioStats,
  ] = await Promise.all([
    // Daily unique visitors
    AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, uniqueVisitors: { $addToSet: '$visitorId' }, events: { $sum: 1 } } },
      { $project: { _id: 0, date: '$_id', uniqueVisitors: { $size: '$uniqueVisitors' }, events: 1 } },
      { $sort: { date: 1 } },
    ]),
    // Most viewed/scanned artifacts
    AnalyticsEvent.aggregate([
      { $match: { entityType: 'artifact', timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$entityId', views: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } }, scans: { $sum: { $cond: [{ $in: ['$eventType', ['ar_scan', 'ar_recognition_success']] }, 1, 0] } }, total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'artifacts', localField: '_id', foreignField: '_id', as: 'artifact' } },
      { $unwind: { path: '$artifact', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, views: 1, scans: 1, total: 1, name: { $ifNull: ['$artifact.name.en', 'Unknown'] } } },
    ]),
    // Most visited exhibitions
    AnalyticsEvent.aggregate([
      { $match: { entityType: 'exhibition', timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$entityId', views: { $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] } }, scans: { $sum: 1 }, total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'exhibitions', localField: '_id', foreignField: '_id', as: 'exhibition' } },
      { $unwind: { path: '$exhibition', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, views: 1, scans: 1, total: 1, name: { $ifNull: ['$exhibition.title.en', 'Unknown'] } } },
    ]),
    // AR recognition method distribution
    AnalyticsEvent.aggregate([
      { $match: { eventType: { $in: ['ar_recognition_success'] }, 'metadata.recognitionMethod': { $exists: true }, timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$metadata.recognitionMethod', count: { $sum: 1 } } },
    ]),
    // Engagement by day of week
    AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { _id: { $dayOfWeek: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Audio narration stats
    AnalyticsEvent.aggregate([
      { $match: { eventType: { $in: ['audio_play', 'audio_complete', 'ar_audio_play'] }, timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]),
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const engagementByDayNamed = engagementByDay.map(d => ({ day: dayNames[d._id - 1] || d._id, count: d.count }));

  const audioStatsObj = {};
  audioStats.forEach(a => { audioStatsObj[a._id] = a.count; });

  res.json({
    dailyVisitors,
    topArtifacts,
    topExhibitions,
    arMethods: arMethodStats.reduce((acc, m) => { acc[m._id] = m.count; return acc; }, {}),
    engagementByDay: engagementByDayNamed,
    audio: {
      plays: (audioStatsObj.audio_play || 0) + (audioStatsObj.ar_audio_play || 0),
      completions: audioStatsObj.audio_complete || 0,
    },
  });
});

// @desc    Get heatmap data (popularity by entity)
// @route   GET /api/admin/analytics/heatmap
export const getHeatmapData = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);

  const [artifactHeat, exhibitionHeat, trailHeat] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { entityType: 'artifact', timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$entityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'artifacts', localField: '_id', foreignField: '_id', as: 'entity' } },
      { $unwind: { path: '$entity', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, name: { $ifNull: ['$entity.name.en', 'Unknown'] }, category: '$entity.category' } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { entityType: 'exhibition', timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$entityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'exhibitions', localField: '_id', foreignField: '_id', as: 'entity' } },
      { $unwind: { path: '$entity', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, name: { $ifNull: ['$entity.title.en', 'Unknown'] } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { entityType: 'trail', timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$entityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'trails', localField: '_id', foreignField: '_id', as: 'entity' } },
      { $unwind: { path: '$entity', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, name: { $ifNull: ['$entity.title.en', 'Unknown'] } } },
    ]),
  ]);

  res.json({ artifacts: artifactHeat, exhibitions: exhibitionHeat, trails: trailHeat });
});

// @desc    Get visitor analytics (trends over time)
// @route   GET /api/admin/analytics/visitors
export const getVisitorAnalytics = asyncHandler(async (req, res) => {
  const { from, to, interval = 'day' } = req.query;
  const match = {};
  if (from || to) {
    match.timestamp = {};
    if (from) match.timestamp.$gte = new Date(from);
    if (to) match.timestamp.$lte = new Date(to);
  }

  let dateFormat;
  switch (interval) {
    case 'hour': dateFormat = { $dateToString: { format: '%Y-%m-%dT%H:00', date: '$timestamp' } }; break;
    case 'month': dateFormat = { $dateToString: { format: '%Y-%m', date: '$timestamp' } }; break;
    default: dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
  }

  const trends = await AnalyticsEvent.aggregate([
    { $match: match },
    {
      $group: {
        _id: dateFormat,
        totalEvents: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        totalEvents: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
      },
    },
    { $sort: { date: 1 } },
  ]);

  res.json(trends);
});
