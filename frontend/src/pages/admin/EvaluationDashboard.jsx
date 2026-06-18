import { useState, useEffect } from 'react';
import { adminFetchEvaluationStats, adminFetchEvaluations, adminDeleteEvaluation, adminExportEvaluations } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Star, TrendingUp, Users, ThumbsUp, Brain, Headphones, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import Pagination from '../../components/ui/Pagination';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';

const COLORS = ['#d97706', '#059669', '#7c3aed', '#0284c7', '#dc2626', '#db2777'];

const RatingBar = ({ label, value, max = 5 }) => {
  const pct = ((value || 0) / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 dark:text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
        <div className="bg-amber-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-slate-800 dark:text-white w-10 text-right">{value || '—'}</span>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, subtext, color = 'bg-amber-500' }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className={`${color} text-white p-3 rounded-lg`}><Icon size={22} /></div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  </div>
);

const EvaluationDashboard = () => {
  const [stats, setStats] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showResponses, setShowResponses] = useState(false);

  useRealtimeSync('evaluation', ['admin-evaluations']);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (showResponses) loadEvaluations();
  }, [page, showResponses]);

  const loadStats = async () => {
    try {
      const { data } = await adminFetchEvaluationStats();
      setStats(data);
    } catch {
      toast.error('Failed to load evaluation stats');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async () => {
    try {
      const { data } = await adminFetchEvaluations({ page, limit: 10 });
      setEvaluations(data.data || data.evaluations || []);
      setTotalPages(data.pagination?.pages || data.pages || 1);
      setTotal(data.pagination?.total || data.total || 0);
    } catch {
      toast.error('Failed to load evaluations');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evaluation response?')) return;
    try {
      await adminDeleteEvaluation(id);
      toast.success('Deleted');
      loadEvaluations();
      loadStats();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await adminExportEvaluations();
      const headers = ['Date', 'Name', 'Email', 'Overall', 'Ease of Use', 'Navigation', 'AR', 'Audio', 'Content', 'AR Improved Understanding', 'Narration Improved', 'Info Easier', 'Would Recommend', 'Comments'];
      const rows = data.map(e => [
        new Date(e.createdAt).toLocaleDateString(),
        e.visitorName || '',
        e.visitorEmail || '',
        e.overallSatisfaction,
        e.easeOfUse || '',
        e.navigationQuality || '',
        e.arUsefulness || '',
        e.audioUsefulness || '',
        e.contentQuality || '',
        e.arImprovedUnderstanding ?? '',
        e.narrationImprovedLearning ?? '',
        e.informationEasierToAccess ?? '',
        e.wouldRecommend ?? '',
        (e.comments || '').replace(/,/g, ';'),
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `evaluations-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!stats) return <p className="text-center py-16 text-slate-500">Failed to load data.</p>;

  const { satisfaction, learningImpact, monthlyTrends, ar } = stats;

  const methodData = Object.entries(ar.methodDistribution || {}).map(([name, value]) => ({ name, value }));
  const learningData = [
    { name: 'AR Understanding', value: learningImpact.arImprovedPercent },
    { name: 'Narration Learning', value: learningImpact.narrationImprovedPercent },
    { name: 'Info Access', value: learningImpact.infoEasierPercent },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Research Evaluation</h1>
        <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Star} label="Avg Satisfaction" value={satisfaction.avgOverall || '—'} subtext={`out of 5 (${satisfaction.total} responses)`} color="bg-amber-500" />
        <StatCard icon={ThumbsUp} label="Recommend Rate" value={`${satisfaction.recommendRate}%`} subtext="would recommend" color="bg-emerald-500" />
        <StatCard icon={Brain} label="AR Impact" value={`${learningImpact.arImprovedPercent}%`} subtext="say AR improved understanding" color="bg-violet-500" />
        <StatCard icon={TrendingUp} label="AR Success Rate" value={`${ar.successRate}%`} subtext={`${ar.successCount} / ${ar.totalScans} scans`} color="bg-sky-500" />
      </div>

      {/* Satisfaction Ratings */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">Visitor Satisfaction Ratings</h2>
          <div className="space-y-3">
            <RatingBar label="Overall" value={satisfaction.avgOverall} />
            <RatingBar label="Ease of Use" value={satisfaction.avgEaseOfUse} />
            <RatingBar label="Navigation" value={satisfaction.avgNavigation} />
            <RatingBar label="AR Usefulness" value={satisfaction.avgAR} />
            <RatingBar label="Audio Quality" value={satisfaction.avgAudio} />
            <RatingBar label="Content Quality" value={satisfaction.avgContent} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">Learning Impact</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={learningData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AR Analytics + Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">AR Recognition Methods</h2>
          {methodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={methodData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10">No AR scan data yet</p>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{ar.totalScans}</p>
              <p className="text-xs text-slate-500">Total Scans</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{ar.successCount}</p>
              <p className="text-xs text-slate-500">Successes</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <p className="text-lg font-bold text-red-600">{ar.failureCount}</p>
              <p className="text-xs text-slate-500">Failures</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">Monthly Evaluation Trends</h2>
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="count" />
                <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} />
                <Tooltip />
                <Line yAxisId="count" type="monotone" dataKey="count" stroke="#d97706" strokeWidth={2} name="Responses" />
                <Line yAxisId="rating" type="monotone" dataKey="avgRating" stroke="#7c3aed" strokeWidth={2} name="Avg Rating" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10">No evaluation data yet</p>
          )}
        </div>
      </div>

      {/* Individual Responses */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm">
        <button
          onClick={() => setShowResponses(!showResponses)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Individual Responses ({satisfaction.total})</h2>
          {showResponses ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>

        {showResponses && (
          <div className="border-t border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="text-left px-4 py-2 text-slate-500">Date</th>
                    <th className="text-left px-4 py-2 text-slate-500">Name</th>
                    <th className="text-left px-4 py-2 text-slate-500">Overall</th>
                    <th className="text-left px-4 py-2 text-slate-500">AR</th>
                    <th className="text-left px-4 py-2 text-slate-500">Recommend</th>
                    <th className="text-left px-4 py-2 text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {evaluations.map((ev) => (
                    <tr key={ev._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(ev.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-white">{ev.visitorName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-amber-600"><Star size={14} /> {ev.overallSatisfaction}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{ev.arUsefulness || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ev.wouldRecommend ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                          {ev.wouldRecommend ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(ev._id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {evaluations.length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No responses yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4">
              <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationDashboard;
