import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import ReportFilters from './ReportFilters';
import { exportToCSV, exportToExcel, exportToPDF } from './exportUtils';
import { fetchBookingReport } from '../../../api';

const BookingReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month' });
  const [guideFilter, setGuideFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadData = async (params) => {
    try {
      setLoading(true);
      const res = await fetchBookingReport({ ...params, guide: guideFilter, status: statusFilter });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load booking report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(filters); }, [guideFilter, statusFilter]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData({ ...newFilters, guide: guideFilter, status: statusFilter });
  };

  const columns = [
    { key: 'referenceNumber', label: 'Booking ID' },
    { key: 'visitorName', label: 'Visitor Name' },
    { key: 'tourDate', label: 'Tour Date', accessor: (r) => new Date(r.tourDate).toLocaleDateString() },
    { key: 'guide', label: 'Guide' },
    { key: 'participants', label: 'Participants' },
    { key: 'status', label: 'Status' },
  ];

  const filtered = (data?.data || []).filter((r) =>
    r.visitorName?.toLowerCase().includes(search.toLowerCase()) ||
    r.referenceNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const guideChartData = data?.byGuide
    ? Object.entries(data.byGuide).map(([name, count]) => ({ name, bookings: count }))
    : [];

  const handleExportCSV = () => exportToCSV(filtered, columns, 'booking-report');
  const handleExportExcel = () => exportToExcel(filtered, columns, 'booking-report');
  const handleExportPDF = () => exportToPDF('Tour Booking Report', filtered, columns, data?.summary);

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

      <h1 className="text-2xl font-bold text-white mb-6">Tour Booking Report</h1>

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
          <p className="text-slate-400 text-xs uppercase font-medium">Total Bookings</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.total || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <UserCheck size={20} className="text-green-400 mt-1" />
          <div>
            <p className="text-slate-400 text-xs uppercase font-medium">Most Requested Guide</p>
            <p className="text-lg font-bold text-white mt-1">{data?.summary?.mostRequestedGuide || 'N/A'}</p>
            <p className="text-xs text-slate-500">{data?.summary?.mostRequestedGuideCount || 0} bookings</p>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Status Breakdown</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {data?.summary?.statusBreakdown && Object.entries(data.summary.statusBreakdown).map(([s, c]) => (
              <span key={s} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">{s}: {c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings by Guide Chart */}
      {guideChartData.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-white font-semibold text-sm mb-4">Bookings by Guide</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={guideChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search bookings..."
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-56 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
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
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Booking ID</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Visitor</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Tour Date</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Guide</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Participants</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row._id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-300 text-xs font-mono">{row.referenceNumber}</td>
                      <td className="px-4 py-3 text-slate-200">{row.visitorName}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{new Date(row.tourDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.guide}</td>
                      <td className="px-4 py-3 text-slate-200">{row.participants}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          row.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                          row.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          row.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{row.status}</span>
                      </td>
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
          <p className="text-slate-500 text-sm text-center py-8">No booking data available</p>
        )}
      </div>
    </div>
  );
};

export default BookingReport;
