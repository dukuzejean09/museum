import { useState, useEffect } from 'react';
import { adminFetchSurveys, adminFetchSurveyStats, adminDeleteSurvey } from '../../api';
import { Star, Trash2, TrendingUp, ThumbsUp, Clock, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [surveysRes, statsRes] = await Promise.all([
        adminFetchSurveys(),
        adminFetchSurveyStats(),
      ]);
      const sData = surveysRes.data;
      setSurveys(Array.isArray(sData) ? sData : sData?.data || []);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this survey response?')) return;
    try {
      await adminDeleteSurvey(id);
      toast.success('Survey deleted');
      load();
    } catch {
      toast.error('Failed to delete survey');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={14} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Visitor Surveys</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="bg-blue-500 text-white p-3 rounded-lg"><BarChart3 size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Total Responses</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="bg-amber-500 text-white p-3 rounded-lg"><Star size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold text-gray-800">{stats.avgRating}/5</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="bg-green-500 text-white p-3 rounded-lg"><ThumbsUp size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Would Recommend</p>
              <p className="text-2xl font-bold text-gray-800">{stats.recommendRate}%</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className="bg-purple-500 text-white p-3 rounded-lg"><Clock size={24} /></div>
            <div>
              <p className="text-sm text-gray-500">Most Common Duration</p>
              <p className="text-sm font-bold text-gray-800">
                {stats.durationBreakdown && Object.keys(stats.durationBreakdown).length > 0
                  ? Object.entries(stats.durationBreakdown).sort((a, b) => b[1] - a[1])[0][0]
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && stats.total > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Rating Distribution</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = surveys.filter(s => s.overallRating === rating).length;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-6">{rating}★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{count} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Survey List */}
      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
          <p>No survey responses yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Individual Responses</h2>
          <div className="space-y-4">
            {surveys.map(s => (
              <div key={s._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-gray-800">{s.visitorName || 'Anonymous'}</p>
                      {renderStars(s.overallRating)}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDelete(s._id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  {(s.favoriteExhibitionName || s.favoriteExhibition) && <span>Favorite: <strong>{s.favoriteExhibitionName || (typeof s.favoriteExhibition === 'object' ? s.favoriteExhibition?.title?.en : s.favoriteExhibition)}</strong></span>}
                  {s.visitDuration && <span>Duration: <strong>{s.visitDuration}</strong></span>}
                  <span>{s.wouldRecommend ? '✓ Would recommend' : '✗ Would not recommend'}</span>
                </div>
                {s.comments && <p className="mt-2 text-sm text-gray-600">{s.comments}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSurveys;
