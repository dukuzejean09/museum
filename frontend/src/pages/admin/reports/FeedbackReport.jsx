import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import ReportFilters from './ReportFilters';
import { exportToCSV, exportToExcel, exportToPDF } from './exportUtils';
import { fetchFeedbackReport } from '../../../api';

const FeedbackReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [ratingFilter, setRatingFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadData = async (params) => {
    try {
      setLoading(true);
      const res = await fetchFeedbackReport({ ...params, rating: ratingFilter });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load feedback report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(filters); }, [ratingFilter]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData({ ...newFilters, rating: ratingFilter });
  };

  const columns = [
    { key: 'visitorName', label: 'Visitor' },
    { key: 'date', label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString('en-US', { timeZone: 'Africa/Kigali' }) },
    { key: 'rating', label: 'Rating' },
    { key: 'comment', label: 'Comment', accessor: (r) => r.comment?.slice(0, 80) || '' },
  ];

  const filtered = (data?.data || []).filter((r) =>
    r.visitorName?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const ratingDistData = data?.summary?.ratingDistribution
    ? Object.entries(data.summary.ratingDistribution).map(([rating, count]) => ({ rating: `${rating} Star`, count }))
    : [];

  const handleExportCSV = () => exportToCSV(filtered, columns, 'feedback-report');
  const handleExportExcel = () => exportToExcel(filtered, columns, 'feedback-report');
  const handleExportPDF = () => exportToPDF('Feedback Report', filtered, columns, {
    total: data?.summary?.total, avgRating: data?.summary?.avgRating
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 text-slate-400 hover:text-amber-400 text-sm mb-4 transition">
        <ArrowLeft size={16} /> Back to Reports
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">Feedback Report</h1>

      <ReportFilters
        onFilterChange={handleFilterChange}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onPrint={() => window.print()}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Total Feedback</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.total || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <Star size={20} className="text-amber-400 mt-1" />
          <div>
            <p className="text-slate-400 text-xs uppercase font-medium">Average Rating</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{data?.summary?.avgRating || 0}</p>
            <p className="text-xs text-slate-500">out of 5</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Rating Distribution</p>
          <div className="flex items-end gap-1 mt-2 h-8">
            {[1, 2, 3, 4, 5].map((r) => {
              const count = data?.summary?.ratingDistribution?.[r] || 0;
              const max = Math.max(...Object.values(data?.summary?.ratingDistribution || { 1: 1 }));
              const height = max > 0 ? (count / max) * 100 : 0;
              return (
                <div key={r} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-amber-500/30 rounded-sm" style={{ height: `${Math.max(height, 4)}%` }}></div>
                  <span className="text-[9px] text-slate-500 mt-0.5">{r}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rating Distribution */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Rating Distribution</h3>
          {ratingDistData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="rating" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No data</p>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Feedback Trends</h3>
          {data?.monthlyTrends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} name="Responses" />
                <Line type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Avg Rating" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No monthly data</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search feedback..."
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-56 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-amber-500"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        {paginated.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Visitor</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Date</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Rating</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row._id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-200">{row.visitorName}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{new Date(row.date).toLocaleDateString('en-US', { timeZone: 'Africa/Kigali' })}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < row.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                          ))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">{row.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                <p className="text-xs text-slate-400">Page {page} of {totalPages} ({filtered.length} items)</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">No feedback data available</p>
        )}
      </div>
    </div>
  );
};

export default FeedbackReport;
