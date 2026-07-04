import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gem, Presentation, Users, UserCog, CalendarDays, Star } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { exportToPDF } from './exportUtils';
import { fetchMuseumSummaryReport } from '../../../api';

const COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

const MuseumSummaryReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchMuseumSummaryReport();
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load museum summary');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const visitorGrowthData = (data?.visitorGrowth || []).map((v) => ({
    month: monthNames[v.month - 1] || v.month,
    visitors: v.visitors,
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm mb-4 transition">
        <ArrowLeft size={16} /> Back to Reports
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Museum Summary Report</h1>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-700 transition"
        >
          Print Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <Gem size={24} className="text-amber-400 mb-2" />
          <p className="text-slate-400 text-xs uppercase font-medium">Total Artifacts</p>
          <p className="text-3xl font-bold text-white mt-1">{data?.summary?.totalArtifacts || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-5">
          <Presentation size={24} className="text-purple-400 mb-2" />
          <p className="text-slate-400 text-xs uppercase font-medium">Total Exhibitions</p>
          <p className="text-3xl font-bold text-white mt-1">{data?.summary?.totalExhibitions || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-5">
          <Users size={24} className="text-blue-400 mb-2" />
          <p className="text-slate-400 text-xs uppercase font-medium">Total Visitors</p>
          <p className="text-3xl font-bold text-white mt-1">{data?.summary?.totalVisitors || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-5">
          <UserCog size={24} className="text-cyan-400 mb-2" />
          <p className="text-slate-400 text-xs uppercase font-medium">Registered Users</p>
          <p className="text-3xl font-bold text-white mt-1">{data?.summary?.totalUsers || 0}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <CalendarDays size={18} className="text-green-400" />
          <div>
            <p className="text-slate-400 text-xs">Tour Bookings</p>
            <p className="text-xl font-bold text-white">{data?.summary?.totalBookings || 0}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Star size={18} className="text-amber-400" />
          <div>
            <p className="text-slate-400 text-xs">Avg. Feedback Rating</p>
            <p className="text-xl font-bold text-white">{data?.feedbackAvgRating || 'N/A'}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Users size={18} className="text-pink-400" />
          <div>
            <p className="text-slate-400 text-xs">Total Surveys</p>
            <p className="text-xl font-bold text-white">{data?.summary?.totalSurveys || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Visitor Growth */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Visitor Growth Trend ({new Date().getFullYear()})</h3>
          {visitorGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={visitorGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No visitor growth data</p>
          )}
        </div>

        {/* Artifact Categories */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Artifact Categories</h3>
          {data?.artifactCategories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.artifactCategories}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ category, count }) => `${category} (${count})`}
                >
                  {data.artifactCategories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No category data</p>
          )}
        </div>

        {/* Exhibition Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Exhibition Status</h3>
          {data?.exhibitionStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.exhibitionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="status" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No exhibition data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MuseumSummaryReport;
