import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportFilters from './ReportFilters';
import { exportToCSV, exportToExcel, exportToPDF } from './exportUtils';
import { fetchUserActivityReport } from '../../../api';

const UserActivityReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadData = async (params) => {
    try {
      setLoading(true);
      const res = await fetchUserActivityReport({ ...params, role: roleFilter });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load user activity report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(filters); }, [roleFilter]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadData({ ...newFilters, role: roleFilter });
  };

  const columns = [
    { key: 'username', label: 'User' },
    { key: 'name', label: 'Full Name' },
    { key: 'role', label: 'Role' },
    { key: 'email', label: 'Email' },
    { key: 'lastLogin', label: 'Last Login', accessor: (r) => r.lastLogin ? new Date(r.lastLogin).toLocaleString('en-US', { timeZone: 'Africa/Kigali' }) : 'Never' },
    { key: 'isActive', label: 'Status', accessor: (r) => r.isActive ? 'Active' : 'Inactive' },
  ];

  const filtered = (data?.users || []).filter((r) =>
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleExportCSV = () => exportToCSV(filtered, columns, 'user-activity-report');
  const handleExportExcel = () => exportToExcel(filtered, columns, 'user-activity-report');
  const handleExportPDF = () => exportToPDF('User Activity Report', filtered, columns, data?.summary);

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

      <h1 className="text-2xl font-bold text-white mb-6">User Activity Report</h1>

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
          <p className="text-slate-400 text-xs uppercase font-medium">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.totalUsers || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase font-medium">Total Logins</p>
          <p className="text-2xl font-bold text-white mt-1">{data?.summary?.totalLogins || 0}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <Activity size={20} className="text-green-400 mt-1" />
          <div>
            <p className="text-slate-400 text-xs uppercase font-medium">Most Active User</p>
            <p className="text-lg font-bold text-white mt-1">{data?.summary?.mostActiveUser || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users..."
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 w-56 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-amber-500"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="guide">Guide</option>
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
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">User</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Full Name</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Role</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Email</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Last Login</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row._id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-200 font-medium">{row.username}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          row.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>{row.role}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.email}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{row.lastLogin ? new Date(row.lastLogin).toLocaleString('en-US', { timeZone: 'Africa/Kigali' }) : 'Never'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          row.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>{row.isActive ? 'Active' : 'Inactive'}</span>
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
          <p className="text-slate-500 text-sm text-center py-8">No user data available</p>
        )}
      </div>
    </div>
  );
};

export default UserActivityReport;
