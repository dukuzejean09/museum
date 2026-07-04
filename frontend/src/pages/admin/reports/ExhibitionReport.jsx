import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Presentation, Trophy, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportFilters from './ReportFilters';
import { exportToCSV, exportToExcel, exportToPDF } from './exportUtils';
import { fetchExhibitionReport } from '../../../api';

const ExhibitionReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month' });
  const [sortBy, setSortBy] = useState('date');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadData = async (params) => {
    try {
      setLoading(true);
      const res = await fetchExhibitionReport({ ...params, sort: sortBy });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load exhibition report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(filters); }, [sortBy]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData({ ...newFilters, sort: sortBy });
  };

  const columns = [
    { key: 'name', label: 'Exhibition Name' },
    { key: 'description', label: 'Description', accessor: (r) => r.description?.slice(0, 60) || '' },
    { key: 'startDate', label: 'Start Date', accessor: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: 'status', label: 'Status' },
    { key: 'visitors', label: 'Visitors' },
  ];

  const filtered = (data?.data || []).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleExportCSV = () => exportToCSV(filtered, columns, 'exhibition-report');
  const handleExportExcel = () => exportToExcel(filtered, columns, 'exhibition-report');
  const handleExportPDF = () => exportToPDF('Exhibition Report', filtered, columns, data?.summary);

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

      <h1 className="text-2xl font-bold text-white mb-6">Exhibition Report</h1>

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
          <p className="text-slate-400 text-xs uppercase font-medium">Total Exhibitions</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.total || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <Trophy size={20} className="text-amber-400 mt-1" />
          <div>
            <p className="text-slate-400 text-xs uppercase font-medium">Most Popular</p>
            <p className="text-lg font-bold text-white mt-1">{data?.summary?.mostPopular || 'N/A'}</p>
            <p className="text-xs text-slate-500">{data?.summary?.mostPopularVisitors || 0} visitors</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search exhibitions..."
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-56 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-amber-500"
        >
          <option value="date">Sort by Date</option>
          <option value="most_visited">Most Visited</option>
          <option value="least_visited">Least Visited</option>
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
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Name</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Status</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Start Date</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row._id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-200 font-medium">{row.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          row.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          row.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{new Date(row.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-200 font-semibold">{row.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
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
          <p className="text-slate-500 text-sm text-center py-8">No exhibition data available</p>
        )}
      </div>
    </div>
  );
};

export default ExhibitionReport;
