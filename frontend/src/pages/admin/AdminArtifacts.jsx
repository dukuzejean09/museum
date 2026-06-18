import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchArtifacts, adminDeleteArtifact } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Edit, Plus, Image as ImageIcon, Search, QrCode, Layers } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import QRPreviewModal from '../../components/admin/QRPreviewModal';
import QRBulkManager from '../../components/admin/QRBulkManager';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';
const imgUrl = (path) => {
 if (!path) return null;
 if (path.startsWith('http')) return path;
 const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
 return `${base}${path}`;
};

const AdminArtifacts = () => {
 const { isAdmin } = useAuth();
 const [artifacts, setArtifacts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [total, setTotal] = useState(0);
 const [qrArtifact, setQrArtifact] = useState(null);
 const [bulkQrOpen, setBulkQrOpen] = useState(false);

 useRealtimeSync('artifact', ['admin-artifacts']);

 const loadArtifacts = useCallback(async () => {
 try {
 setLoading(true);
 const params = { page, limit: 10 };
 if (search) params.search = search;
 if (statusFilter) params.status = statusFilter;

 const { data } = await adminFetchArtifacts(params);
 if (Array.isArray(data)) {
 setArtifacts(data);
 setTotal(data.length);
 setTotalPages(1);
 } else {
 setArtifacts(data.data || data.artifacts || data.docs || []);
 setTotal(data.pagination?.total || data.total || data.totalDocs || 0);
 setTotalPages(data.pagination?.pages || data.pages || data.totalPages || 1);
 }
 } catch (err) {
 toast.error('Failed to load artifacts');
 } finally {
 setLoading(false);
 }
 }, [page, search, statusFilter]);

 useEffect(() => {
 loadArtifacts();
 }, [loadArtifacts]);

 const handleDelete = async (id, name) => {
 if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
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
 return <TableSkeleton />;
 }

 return (
 <div>
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
 <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Artifacts</h1>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setBulkQrOpen(true)}
 className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition font-medium text-sm"
 >
 <Layers size={16} /> Bulk QR
 </button>
 <Link
 to="/admin/artifacts/new"
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
 >
 <Plus size={18} /> Add Artifact
 </Link>
 </div>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-3 mb-4">
 <form onSubmit={handleSearch} className="relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by name..."
 className="form-input pl-9 pr-4 text-sm w-full sm:w-64"
 />
 </form>
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

 <div className="card overflow-hidden overflow-x-auto !p-0">
 <table className="w-full min-w-[600px]">
 <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
 <tr>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Image</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Name</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Category</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Views</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {artifacts.map((artifact) => (
 <tr key={artifact._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
 <td className="px-6 py-4">
 {artifact.image ? (
 <img
 src={imgUrl(artifact.image)}
 alt={artifact.name?.en || 'Image'}
 className="w-12 h-12 rounded-lg object-cover"
 />
 ) : (
 <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
 <ImageIcon size={18} />
 </div>
 )}
 </td>
 <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
 {artifact.name?.en || '-'}
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
 {artifact.category || '-'}
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={artifact.status || 'draft'} />
 </td>
 <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
 {artifact.stats?.views ?? 0}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <button
 onClick={() => setQrArtifact(artifact)}
 className="p-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition"
 title="QR Code"
 >
 <QrCode size={18} />
 </button>
 <Link
 to={`/admin/artifacts/edit/${artifact._id}`}
 className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
 title="Edit"
 >
 <Edit size={18} />
 </Link>
 {isAdmin && (
 <button
 onClick={() => handleDelete(artifact._id, artifact.name?.en)}
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
 <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
 No artifacts found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />

 <QRPreviewModal
 isOpen={!!qrArtifact}
 onClose={() => setQrArtifact(null)}
 entityType="artifact"
 entity={qrArtifact}
 frontendUrl={window.location.origin}
 />
 <QRBulkManager
 isOpen={bulkQrOpen}
 onClose={() => setBulkQrOpen(false)}
 items={artifacts}
 entityType="artifact"
 />
 </div>
 );
};

export default AdminArtifacts;
