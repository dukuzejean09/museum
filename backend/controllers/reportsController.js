import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import Trail from '../models/Trail.js';
import Guide from '../models/Guide.js';
import Booking from '../models/Booking.js';
import Survey from '../models/Survey.js';
import Admin from '../models/Admin.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import AccessCode from '../models/AccessCode.js';
import { asyncHandler } from '../utils/errors.js';

const KIGALI_TZ = 'Africa/Kigali';
const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000; // UTC+2, no DST

// Get current date parts in Kigali timezone
const kigaliNow = () => {
  const now = new Date();
  const kigali = new Date(now.getTime() + KIGALI_OFFSET_MS);
  return {
    utcNow: now,
    year: kigali.getUTCFullYear(),
    month: kigali.getUTCMonth(),
    date: kigali.getUTCDate(),
    day: kigali.getUTCDay(),
  };
};

// Create a UTC Date from Kigali date parts (midnight Kigali = 22:00 UTC previous day)
const kigaliMidnight = (year, month, date) => {
  return new Date(Date.UTC(year, month, date) - KIGALI_OFFSET_MS);
};

// Helper: build date filter from query params (all boundaries in Kigali time)
const buildDateFilter = (query) => {
  const { period, from, to } = query;
  const k = kigaliNow();
  let start, end;

  switch (period) {
    case 'today':
      start = kigaliMidnight(k.year, k.month, k.date);
      end = kigaliMidnight(k.year, k.month, k.date + 1);
      break;
    case 'week':
      start = kigaliMidnight(k.year, k.month, k.date - k.day);
      end = kigaliMidnight(k.year, k.month, k.date + 1);
      break;
    case 'month':
      start = kigaliMidnight(k.year, k.month, 1);
      end = kigaliMidnight(k.year, k.month, k.date + 1);
      break;
    case 'custom':
      if (from) {
        const [fy, fm, fd] = from.split('-').map(Number);
        start = kigaliMidnight(fy, fm - 1, fd);
      }
      if (to) {
        const [ty, tm, td] = to.split('-').map(Number);
        end = kigaliMidnight(ty, tm - 1, td + 1);
      }
      break;
    default:
      break;
  }

  const filter = {};
  if (start) filter.$gte = start;
  if (end) filter.$lt = end;
  return Object.keys(filter).length > 0 ? filter : null;
};

// @desc    Visitor Report
// @route   GET /api/admin/reports/visitors
export const getVisitorReport = asyncHandler(async (req, res) => {
  const dateFilter = buildDateFilter(req.query);
  const k = kigaliNow();

  const todayStart = kigaliMidnight(k.year, k.month, k.date);
  const todayEnd = kigaliMidnight(k.year, k.month, k.date + 1);
  const weekStart = kigaliMidnight(k.year, k.month, k.date - k.day);
  const monthStart = kigaliMidnight(k.year, k.month, 1);

  // Count unique visitors by period
  const [todayVisitors, weekVisitors, monthVisitors] = await Promise.all([
    AnalyticsEvent.distinct('visitorId', { timestamp: { $gte: todayStart, $lt: todayEnd } }),
    AnalyticsEvent.distinct('visitorId', { timestamp: { $gte: weekStart, $lt: todayEnd } }),
    AnalyticsEvent.distinct('visitorId', { timestamp: { $gte: monthStart, $lt: todayEnd } }),
  ]);

  // Daily trends (last 30 days or custom range)
  const trendStart = dateFilter?.$gte || new Date(k.utcNow.getTime() - 30 * 24 * 60 * 60 * 1000);
  const trendEnd = dateFilter?.$lt || todayEnd;

  const dailyTrends = await AnalyticsEvent.aggregate([
    { $match: { timestamp: { $gte: trendStart, $lt: trendEnd } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: KIGALI_TZ } },
        visitors: { $addToSet: '$visitorId' },
      },
    },
    { $project: { date: '$_id', visitors: { $size: '$visitors' }, _id: 0 } },
    { $sort: { date: 1 } },
  ]);

  // Weekly trends
  const weeklyTrends = await AnalyticsEvent.aggregate([
    { $match: { timestamp: { $gte: trendStart, $lt: trendEnd } } },
    {
      $group: {
        _id: { $isoWeek: { date: '$timestamp', timezone: KIGALI_TZ } },
        year: { $first: { $isoWeekYear: { date: '$timestamp', timezone: KIGALI_TZ } } },
        visitors: { $addToSet: '$visitorId' },
      },
    },
    { $project: { week: '$_id', year: 1, visitors: { $size: '$visitors' }, _id: 0 } },
    { $sort: { year: 1, week: 1 } },
  ]);

  // Monthly trends
  const yearStart = kigaliMidnight(k.year, 0, 1);
  const monthlyTrends = await AnalyticsEvent.aggregate([
    { $match: { timestamp: { $gte: yearStart, $lt: trendEnd } } },
    {
      $group: {
        _id: {
          month: { $month: { date: '$timestamp', timezone: KIGALI_TZ } },
          year: { $year: { date: '$timestamp', timezone: KIGALI_TZ } },
        },
        visitors: { $addToSet: '$visitorId' },
      },
    },
    { $project: { month: '$_id.month', year: '$_id.year', visitors: { $size: '$visitors' }, _id: 0 } },
    { $sort: { year: 1, month: 1 } },
  ]);

  // Add percentage changes to daily trends
  const dailyWithChange = dailyTrends.map((day, i) => {
    const prev = i > 0 ? dailyTrends[i - 1].visitors : day.visitors;
    const change = prev > 0 ? ((day.visitors - prev) / prev * 100).toFixed(1) : 0;
    return { ...day, change: Number(change) };
  });

  res.json({
    summary: {
      today: todayVisitors.length,
      thisWeek: weekVisitors.length,
      thisMonth: monthVisitors.length,
    },
    dailyTrends: dailyWithChange,
    weeklyTrends,
    monthlyTrends,
  });
});

// @desc    Exhibition Report
// @route   GET /api/admin/reports/exhibitions
export const getExhibitionReport = asyncHandler(async (req, res) => {
  const { sort = 'date', order = 'desc' } = req.query;
  const dateFilter = buildDateFilter(req.query);

  const matchStage = dateFilter ? { createdAt: dateFilter } : {};

  const exhibitions = await Exhibition.find(matchStage).lean();

  // Get visitor counts per exhibition from analytics
  const exhibitionViews = await AnalyticsEvent.aggregate([
    { $match: { entityType: 'exhibition', eventType: 'view' } },
    {
      $group: {
        _id: '$entityId',
        visitors: { $addToSet: '$visitorId' },
        totalViews: { $sum: 1 },
      },
    },
    { $project: { entityId: '$_id', visitors: { $size: '$visitors' }, totalViews: 1, _id: 0 } },
  ]);

  const viewsMap = {};
  exhibitionViews.forEach((v) => {
    viewsMap[v.entityId.toString()] = v.visitors;
  });

  let results = exhibitions.map((ex) => ({
    _id: ex._id,
    name: ex.title?.en || ex.title?.fr || ex.title?.rw || 'Untitled',
    description: ex.shortDescription?.en || ex.shortDescription?.fr || '',
    startDate: ex.createdAt,
    endDate: ex.updatedAt,
    status: ex.status,
    visitors: viewsMap[ex._id.toString()] || 0,
  }));

  // Sort
  if (sort === 'most_visited') {
    results.sort((a, b) => b.visitors - a.visitors);
  } else if (sort === 'least_visited') {
    results.sort((a, b) => a.visitors - b.visitors);
  } else {
    results.sort((a, b) => order === 'desc'
      ? new Date(b.startDate) - new Date(a.startDate)
      : new Date(a.startDate) - new Date(b.startDate));
  }

  const mostPopular = results.reduce((max, ex) => ex.visitors > (max?.visitors || 0) ? ex : max, null);

  res.json({
    summary: {
      total: results.length,
      mostPopular: mostPopular?.name || 'N/A',
      mostPopularVisitors: mostPopular?.visitors || 0,
    },
    data: results,
  });
});

// @desc    Artifact Report
// @route   GET /api/admin/reports/artifacts
export const getArtifactReport = asyncHandler(async (req, res) => {
  const { category, status, exhibition } = req.query;
  const dateFilter = buildDateFilter(req.query);

  const match = {};
  if (dateFilter) match.createdAt = dateFilter;
  if (category) match.category = category;
  if (status) match.status = status;

  const artifacts = await Artifact.find(match).lean();

  // Get exhibitions for artifact mapping
  const exhibitions = await Exhibition.find({}).select('title artifacts').lean();
  const artifactExhibitionMap = {};
  exhibitions.forEach((ex) => {
    (ex.artifacts || []).forEach((artId) => {
      artifactExhibitionMap[artId.toString()] = ex.title?.en || ex.title?.fr || 'Unknown';
    });
  });

  const results = artifacts.map((art) => ({
    _id: art._id,
    name: art.name?.en || art.name?.fr || art.name?.rw || 'Untitled',
    category: art.category || 'Uncategorized',
    exhibition: artifactExhibitionMap[art._id.toString()] || 'Unassigned',
    status: art.status || 'draft',
    acquisitionDate: art.dateDiscovered || art.createdAt,
    views: art.stats?.views || 0,
  }));

  // Summary counts
  const statusCounts = {
    total: artifacts.length,
    published: artifacts.filter((a) => a.status === 'published').length,
    draft: artifacts.filter((a) => a.status === 'draft').length,
    archived: artifacts.filter((a) => a.status === 'archived').length,
  };

  // Categories breakdown
  const categories = {};
  artifacts.forEach((a) => {
    const cat = a.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.json({
    summary: statusCounts,
    categories,
    data: results,
  });
});

// @desc    Tour Booking Report
// @route   GET /api/admin/reports/bookings
export const getBookingReport = asyncHandler(async (req, res) => {
  const { guide, status: bookingStatus } = req.query;
  const dateFilter = buildDateFilter(req.query);

  const match = {};
  if (dateFilter) match.createdAt = dateFilter;
  if (guide) match.guideId = guide;
  if (bookingStatus) match.status = bookingStatus;

  const bookings = await Booking.find(match)
    .populate('guideId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const results = bookings.map((b) => ({
    _id: b._id,
    referenceNumber: b.referenceNumber,
    visitorName: b.visitorName,
    tourDate: b.date,
    time: b.time,
    guide: b.guideId?.name || 'Unassigned',
    guideId: b.guideId?._id,
    participants: b.groupSize,
    status: b.status,
    visitType: b.visitType,
    createdAt: b.createdAt,
  }));

  // Summary stats
  const totalBookings = bookings.length;
  const statusBreakdown = {};
  bookings.forEach((b) => {
    statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
  });

  // Bookings by guide
  const byGuide = {};
  bookings.forEach((b) => {
    const guideName = b.guideId?.name || 'Unassigned';
    byGuide[guideName] = (byGuide[guideName] || 0) + 1;
  });

  // Most requested guide
  const mostRequested = Object.entries(byGuide).reduce(
    (max, [name, count]) => count > max.count ? { name, count } : max,
    { name: 'N/A', count: 0 }
  );

  res.json({
    summary: {
      total: totalBookings,
      statusBreakdown,
      mostRequestedGuide: mostRequested.name,
      mostRequestedGuideCount: mostRequested.count,
    },
    byGuide,
    data: results,
  });
});

// @desc    Feedback Report
// @route   GET /api/admin/reports/feedback
export const getFeedbackReport = asyncHandler(async (req, res) => {
  const { rating } = req.query;
  const dateFilter = buildDateFilter(req.query);

  const match = {};
  if (dateFilter) match.createdAt = dateFilter;
  if (rating) match.overallRating = Number(rating);

  const surveys = await Survey.find(match).sort({ createdAt: -1 }).lean();

  const results = surveys.map((s) => ({
    _id: s._id,
    visitorName: s.visitorName || 'Anonymous',
    date: s.createdAt,
    rating: s.overallRating,
    comment: s.comments || '',
    wouldRecommend: s.wouldRecommend,
    visitDuration: s.visitDuration,
  }));

  // Rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  surveys.forEach((s) => {
    if (s.overallRating >= 1 && s.overallRating <= 5) {
      ratingDistribution[s.overallRating]++;
    }
  });

  // Monthly trends
  const monthlyTrends = {};
  surveys.forEach((s) => {
    const month = new Date(s.createdAt).toLocaleDateString('en-CA', { timeZone: KIGALI_TZ, year: 'numeric', month: '2-digit' }).slice(0, 7);
    if (!monthlyTrends[month]) monthlyTrends[month] = { count: 0, totalRating: 0 };
    monthlyTrends[month].count++;
    monthlyTrends[month].totalRating += s.overallRating;
  });

  const monthlyData = Object.entries(monthlyTrends)
    .map(([month, data]) => ({
      month,
      count: data.count,
      avgRating: (data.totalRating / data.count).toFixed(1),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const avgRating = surveys.length > 0
    ? (surveys.reduce((sum, s) => sum + s.overallRating, 0) / surveys.length).toFixed(1)
    : 0;

  res.json({
    summary: {
      total: surveys.length,
      avgRating: Number(avgRating),
      ratingDistribution,
    },
    monthlyTrends: monthlyData,
    data: results,
  });
});

// @desc    User Activity Report
// @route   GET /api/admin/reports/user-activity
export const getUserActivityReport = asyncHandler(async (req, res) => {
  const { user, role } = req.query;
  const dateFilter = buildDateFilter(req.query);

  // Get admin users
  const adminMatch = {};
  if (user) adminMatch._id = user;
  if (role) adminMatch.role = role;

  const admins = await Admin.find(adminMatch).select('username email role lastLoginAt isActive profile').lean();

  // Get analytics-based activity (content changes tracked via timestamps)
  const activityMatch = {};
  if (dateFilter) activityMatch.timestamp = dateFilter;

  const recentActivity = await AnalyticsEvent.aggregate([
    { $match: activityMatch },
    {
      $group: {
        _id: '$visitorId',
        totalActions: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        actions: { $push: { type: '$eventType', entity: '$entityType', timestamp: '$timestamp' } },
      },
    },
    { $sort: { totalActions: -1 } },
    { $limit: 50 },
  ]);

  // Build user activity data from admin logins
  const userActivity = admins.map((admin) => ({
    _id: admin._id,
    username: admin.username,
    name: `${admin.profile?.firstName || ''} ${admin.profile?.lastName || ''}`.trim() || admin.username,
    role: admin.role,
    email: admin.email,
    lastLogin: admin.lastLoginAt,
    isActive: admin.isActive,
  }));

  // Summary
  const totalLogins = admins.filter((a) => a.lastLoginAt).length;
  const mostActive = admins.reduce(
    (max, a) => (a.lastLoginAt && (!max.lastLoginAt || a.lastLoginAt > max.lastLoginAt)) ? a : max,
    {}
  );

  res.json({
    summary: {
      totalUsers: admins.length,
      totalLogins,
      mostActiveUser: mostActive.username || 'N/A',
    },
    users: userActivity,
    recentActivity,
  });
});

// @desc    Museum Summary Report
// @route   GET /api/admin/reports/summary
export const getMuseumSummaryReport = asyncHandler(async (req, res) => {
  const k = kigaliNow();
  const monthStart = kigaliMidnight(k.year, k.month, 1);

  const [
    totalArtifacts,
    totalExhibitions,
    totalBookings,
    totalUsers,
    totalSurveys,
    artifactCategories,
    surveyStats,
    monthlyVisitors,
    exhibitionStats,
  ] = await Promise.all([
    Artifact.countDocuments(),
    Exhibition.countDocuments(),
    Booking.countDocuments(),
    Admin.countDocuments(),
    Survey.countDocuments(),
    Artifact.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Survey.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$overallRating' }, total: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: kigaliMidnight(k.year, 0, 1) } } },
      {
        $group: {
          _id: { month: { $month: { date: '$timestamp', timezone: KIGALI_TZ } } },
          visitors: { $addToSet: '$visitorId' },
        },
      },
      { $project: { month: '$_id.month', visitors: { $size: '$visitors' }, _id: 0 } },
      { $sort: { month: 1 } },
    ]),
    Exhibition.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  // Total unique visitors
  const totalVisitors = await AnalyticsEvent.distinct('visitorId');

  res.json({
    summary: {
      totalArtifacts,
      totalExhibitions,
      totalVisitors: totalVisitors.length,
      totalUsers,
      totalBookings,
      totalSurveys,
    },
    artifactCategories: artifactCategories.map((c) => ({
      category: c._id || 'Uncategorized',
      count: c.count,
    })),
    visitorGrowth: monthlyVisitors,
    exhibitionStats: exhibitionStats.map((s) => ({ status: s._id, count: s.count })),
    feedbackAvgRating: surveyStats[0]?.avgRating?.toFixed(1) || 0,
    bookingTotal: totalBookings,
  });
});
