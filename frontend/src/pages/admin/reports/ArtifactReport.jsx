import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gem } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import ReportFilters from './ReportFilters';
import { exportToCSV, exportToExcel, exportToPDF } from './exportUtils';
import { fetchArtifactReport } from '../../../api';

const COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#ec4899', '#6366f1'];

const ArtifactReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ period: 'month' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadData = async (params) => {
    try {
      setLoading(true);
      const res = await fetchArtifactReport({ ...params, category: categoryFilter, status: statusFilter });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load artifact report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(filters); }, [categoryFilter, statusFilter]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData({ ...newFilters, category: categoryFilter, status: statusFilter });
  };

  const columns = [
    { key: 'name', label: 'Artifact Name' },
    { key: 'category', label: 'Category' },
    { key: 'exhibition', label: 'Exhibition' },
    { key: 'status', label: 'Status' },
    { key: 'acquisitionDate', label: 'Acquisition Date', accessor: (r) => r.acquisitionDate ? new Date(r.acquisitionDate).toLocaleDateString() : 'N/A' },
  ];

  const filtered = (data?.data || []).filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const categoryData = data?.categories
    ? Object.entries(data.categories).map(([name, value]) => ({ name, value }))
    : [];

  const handleExportCSV = () => exportToCSV(filtered, columns, 'artifact-report');
  const handleExportExcel = () => exportToExcel(filtered, columns, 'artifact-report');
  const handleExportPDF = () => exportToPDF('Artifact Report', filtered, columns, data?.summary);

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

      <h1 className="text-2xl font-bold text-white mb-6">Artifact Report</h1>

      <ReportFilters
        onFilterChange={handleFilterChange}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onPrint={() => window.print()}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.total || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 text-xs uppercase font-medium">Published</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.published || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-xs uppercase font-medium">Draft</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.draft || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Archived</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.archived || 0}</p>
        </div>
      </div>

      {/* Category Chart */}
      {categoryData.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-white font-semibold text-sm mb-4">Artifacts by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} (${value})`}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Additional Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search artifacts..."
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-56 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        {categoryData.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-amber-500"
          >
            <option value="">All Categories</option>
            {categoryData.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        )}
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
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Category</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Exhibition</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Status</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Acquired</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row._id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-200 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.category}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.exhibition}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          row.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          row.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.acquisitionDate ? new Date(row.acquisitionDate).toLocaleDateString() : 'N/A'}</td>
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
          <p className="text-slate-500 text-sm text-center py-8">No artifact data available</p>
        )}
      </div>
    </div>
  );
};

export default ArtifactReport;
