import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchArtifacts, adminDeleteArtifact } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit, Plus, Image as ImageIcon, Search } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

const ARTIFACT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'object', label: 'Object' },
  { value: 'image', label: 'Image' },
  { value: 'document', label: 'Document' },
  { value: 'location', label: 'Location' },
  { value: 'specimen', label: 'Specimen' },
];

const AdminArtifacts = () => {
  const { isAdmin } = useAuth();
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const loadArtifacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await adminFetchArtifacts(params);
      if (Array.isArray(data)) {
        setArtifacts(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setArtifacts(data.artifacts || data.docs || []);
        setTotal(data.total || data.totalDocs || 0);
        setTotalPages(data.pages || data.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load artifacts');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    try {
      await adminDeleteArtifact(id);
      toast.success('Artifact deleted');
      loadArtifacts();
    } catch (err) {
      toast.error('Failed to delete artifact');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadArtifacts();
  };

  if (loading && artifacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Artifacts</h1>
        <Link
          to="/admin/artifacts/new"
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} /> Add Artifact
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
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
        >
          {ARTIFACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
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
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Type</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Year</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Views</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {artifacts.map((artifact) => (
              <tr key={artifact._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4">
                  {artifact.coverImage ? (
                    <img
                      src={`${baseUrl}${artifact.coverImage}`}
                      alt={artifact.title?.en || 'Cover'}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                  {artifact.title?.en || artifact.title || '-'}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">
                  {artifact.type || '-'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={artifact.status || 'draft'} />
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {artifact.year || '-'}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {artifact.stats?.views ?? 0}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/artifacts/edit/${artifact._id}`}
                      className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(artifact._id, artifact.title?.en || artifact.title)}
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
            {artifacts.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No artifacts found.
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

export default AdminArtifacts;
