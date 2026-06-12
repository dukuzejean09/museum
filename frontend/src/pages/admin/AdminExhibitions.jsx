import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchExhibitions, adminDeleteExhibition } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Route, Image as ImageIcon, Search } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const AdminExhibitions = () => {
  const { isAdmin } = useAuth();
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const loadExhibitions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const { data } = await adminFetchExhibitions(params);
      if (Array.isArray(data)) {
        setExhibitions(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setExhibitions(data.exhibitions || data.docs || []);
        setTotal(data.total || data.totalDocs || 0);
        setTotalPages(data.pages || data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadExhibitions();
  }, [loadExhibitions]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    try {
      await adminDeleteExhibition(id);
      toast.success('Exhibition deleted');
      loadExhibitions();
    } catch (err) {
      toast.error('Failed to delete exhibition');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadExhibitions();
  };

  if (loading && exhibitions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Exhibitions</h1>
        <Link
          to="/admin/exhibitions/new"
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition font-medium"
        >
          <Plus size={20} /> Create Exhibition
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm w-64"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Cover</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Title</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Views</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {exhibitions.map((ex) => (
              <tr key={ex._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4">
                  {ex.coverImage ? (
                    <img
                      src={`${baseUrl}${ex.coverImage}`}
                      alt={ex.title?.en || 'Cover'}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                  {ex.title?.en || ex.title || '-'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={ex.status || 'draft'} />
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {ex.views ?? 0}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/exhibitions/edit/${ex._id}`}
                      className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    <Link
                      to={`/admin/trails/new?exhibitionId=${ex._id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                      title="Create Trail"
                    >
                      <Route size={18} />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(ex._id, ex.title?.en || ex.title)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {exhibitions.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No exhibitions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
    </div>
  );
};

export default AdminExhibitions;
