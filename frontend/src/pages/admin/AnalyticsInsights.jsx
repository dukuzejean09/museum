import { useState, useEffect } from 'react';
import { fetchAnalyticsInsights, fetchHeatmapData } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Eye, Scan, Headphones, Flame, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';

const COLORS = ['#d97706', '#059669', '#7c3aed', '#0284c7', '#dc2626', '#db2777', '#ea580c', '#0891b2'];

const HeatBar = ({ items, maxCount, label }) => {
  if (!items?.length) return <p className="text-slate-400 text-sm text-center py-4">No data</p>;
  const max = maxCount || Math.max(...items.map(i => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item._id || i} className="flex items-center gap-3">
          <span className="text-xs text-slate-600 dark:text-slate-400 w-32 truncate shrink-0" title={item.name}>{item.name}</span>
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-5 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: `hsl(${30 + (i * 15)}, 80%, ${55 - i * 2}%)`,
              }}
            />
            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsInsights = () => {
  const [insights, setInsights] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useRealtimeSync('exhibition', ['analytics']);
  useRealtimeSync('artifact', ['analytics']);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insightsRes, heatmapRes] = await Promise.all([
        fetchAnalyticsInsights({ period }),
        fetchHeatmapData({ period }),
      ]);
      setInsights(insightsRes.data);
      setHeatmap(heatmapRes.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!insights) return <p className="text-center py-16 text-slate-500">Failed to load data.</p>;

  const arMethodData = Object.entries(insights.arMethods || {}).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics Insights</h1>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-5 flex items-center gap-3">
          <div className="bg-sky-500 text-white p-3 rounded-lg"><Eye size={20} /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Events</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{insights.dailyVisitors?.reduce((s, d) => s + d.events, 0) || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-5 flex items-center gap-3">
          <div className="bg-amber-500 text-white p-3 rounded-lg"><Scan size={20} /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">AR Scans</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{Object.values(insights.arMethods || {}).reduce((s, v) => s + v, 0)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-5 flex items-center gap-3">
          <div className="bg-violet-500 text-white p-3 rounded-lg"><Headphones size={20} /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Audio Plays</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{insights.audio?.plays || 0}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-5 flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-3 rounded-lg"><TrendingUp size={20} /></div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Audio Completions</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{insights.audio?.completions || 0}</p>
          </div>
        </div>
      </div>

      {/* Daily Visitors Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="section-title">Daily Visitor Activity</h2>
        {insights.dailyVisitors?.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={insights.dailyVisitors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="#d97706" strokeWidth={2} name="Events" />
              <Line type="monotone" dataKey="uniqueVisitors" stroke="#7c3aed" strokeWidth={2} name="Unique Visitors" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-400 py-10">No visitor data</p>
        )}
      </div>

      {/* AR Methods + Engagement by Day */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">AR Recognition Methods</h2>
          {arMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={arMethodData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {arMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10">No AR data</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">Engagement by Day</h2>
          {insights.engagementByDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={insights.engagementByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 py-10">No data</p>
          )}
        </div>
      </div>

      {/* Heatmap / Popularity Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Most Popular Artifacts
          </h2>
          <p className="text-xs text-slate-400 mb-4">Ranked by total interactions</p>
          <HeatBar items={heatmap?.artifacts} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Most Popular Exhibitions
          </h2>
          <p className="text-xs text-slate-400 mb-4">Ranked by total interactions</p>
          <HeatBar items={heatmap?.exhibitions} />
        </div>
      </div>

      {/* Top entities tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">Top Scanned Artifacts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left px-3 py-2 text-slate-500">Name</th><th className="text-right px-3 py-2 text-slate-500">Views</th><th className="text-right px-3 py-2 text-slate-500">Scans</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {insights.topArtifacts?.map((a) => (
                  <tr key={a._id}>
                    <td className="px-3 py-2 text-slate-800 dark:text-white truncate max-w-[200px]">{a.name}</td>
                    <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{a.views}</td>
                    <td className="px-3 py-2 text-right text-amber-600 font-medium">{a.scans}</td>
                  </tr>
                ))}
                {!insights.topArtifacts?.length && <tr><td colSpan="3" className="px-3 py-6 text-center text-slate-400">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="section-title">Top Visited Exhibitions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left px-3 py-2 text-slate-500">Name</th><th className="text-right px-3 py-2 text-slate-500">Views</th><th className="text-right px-3 py-2 text-slate-500">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {insights.topExhibitions?.map((e) => (
                  <tr key={e._id}>
                    <td className="px-3 py-2 text-slate-800 dark:text-white truncate max-w-[200px]">{e.name}</td>
                    <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{e.views}</td>
                    <td className="px-3 py-2 text-right text-amber-600 font-medium">{e.total}</td>
                  </tr>
                ))}
                {!insights.topExhibitions?.length && <tr><td colSpan="3" className="px-3 py-6 text-center text-slate-400">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trail Heatmap */}
      {heatmap?.trails?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
            <Flame size={18} className="text-orange-500" /> Popular Trails
          </h2>
          <p className="text-xs text-slate-400 mb-4">Ranked by visitor interactions</p>
          <HeatBar items={heatmap.trails} />
        </div>
      )}
    </div>
  );
};

export default AnalyticsInsights;
