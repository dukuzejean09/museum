import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchTrails, adminDeleteTrail } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, Star, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
const ITEMS_PER_PAGE = 10;

const AdminTrails = () => {
 const { isAdmin } = useAuth();
 const [trails, setTrails] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [page, setPage] = useState(1);

 const loadTrails = async () => {
 try {
 const { data } = await adminFetchTrails();
 setTrails(data.data || data || []);
 } catch {
 toast.error('Failed to load trails');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadTrails();
 }, []);

 const handleDelete = async (id, title) => {
 if (!window.confirm(`Delete "${title}"?`)) return;
 try {
 await adminDeleteTrail(id);
 toast.success('Trail deleted');
 loadTrails();
 } catch {
 toast.error('Failed to delete trail');
 }
 };

 // Filter + paginate
 const filtered = useMemo(() => {
 if (!search.trim()) return trails;
 const term = search.toLowerCase();
 return trails.filter((t) => {
 const title = t.title?.en || t.title || '';
 const tags = Array.isArray(t.tags) ? t.tags.join(' ') : '';
 return title.toLowerCase().includes(term) || tags.toLowerCase().includes(term);
 });
 }, [trails, search]);

 const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
 const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

 // Reset page when search changes
 useEffect(() => {
 setPage(1);
 }, [search]);

 const difficultyBadge = (level) => {
 const colors = {
 easy: 'bg-green-100 text-green-700',
 moderate: 'bg-yellow-100 text-yellow-700',
 detailed: 'bg-red-100 text-red-700',
 };
 return (
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[level] || colors.easy}`}>
 {level || 'easy'}
 </span>
 );
 };

 const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

 if (loading) {
 return <TableSkeleton />;
 }

 return (
 <div>
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Trails</h1>
 <div className="flex items-center gap-3 w-full sm:w-auto">
 {/* Search */}
 <div className="relative flex-1 sm:w-64">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search trails..."
 className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-amber-500"
 />
 </div>
 <Link
 to="/admin/trails/new"
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition font-medium whitespace-nowrap"
 >
 <Plus size={20} /> Add Trail
 </Link>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-slate-50 border-b border-slate-200">
 <tr>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Cover
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Title
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Difficulty
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Duration
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Stops
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Featured
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Status
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {paginated.map((trail) => {
 const title = trail.title?.en || trail.title || 'Untitled';
 const stopCount = trail.stopCount ?? trail.stops?.length ?? 0;

 return (
 <tr key={trail._id} className="hover:bg-slate-50 transition">
 {/* Cover */}
 <td className="px-4 py-3">
 {trail.coverImage ? (
 <img
 src={`${baseUrl}${trail.coverImage}`}
 alt=""
 className="w-12 h-12 rounded-lg object-cover"
 />
 ) : (
 <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
 <MapPin size={18} className="text-slate-400" />
 </div>
 )}
 </td>

 {/* Title */}
 <td className="px-4 py-3">
 <span className="font-medium text-slate-800">{title}</span>
 </td>

 {/* Difficulty */}
 <td className="px-4 py-3">{difficultyBadge(trail.difficulty)}</td>

 {/* Duration */}
 <td className="px-4 py-3">
 <span className="flex items-center gap-1 text-sm text-slate-600">
 <Clock size={14} />
 {trail.estimatedMinutes || 30} min
 </span>
 </td>

 {/* Stops */}
 <td className="px-4 py-3">
 <span className="text-sm text-slate-600">{stopCount}</span>
 </td>

 {/* Featured */}
 <td className="px-4 py-3">
 {trail.isFeatured && (
 <Star size={16} className="text-amber-500 fill-amber-500" />
 )}
 </td>

 {/* Active */}
 <td className="px-4 py-3">
 <span
 className={`px-2 py-0.5 text-xs font-medium rounded-full ${
 trail.isActive !== false
 ? 'bg-green-100 text-green-700'
 : 'bg-slate-100 text-slate-500'
 }`}
 >
 {trail.isActive !== false ? 'Active' : 'Inactive'}
 </span>
 </td>

 {/* Actions */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-1">
 <Link
 to={`/admin/trails/edit/${trail._id}`}
 className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
 title="Edit"
 >
 <Edit size={18} />
 </Link>
 {isAdmin && (
 <button
 onClick={() => handleDelete(trail._id, title)}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
 title="Delete"
 >
 <Trash2 size={18} />
 </button>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 {paginated.length === 0 && (
 <tr>
 <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
 {search ? 'No trails match your search.' : 'No trails found. Add your first trail!'}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
 <span className="text-sm text-slate-500">
 Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
 {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
 </span>
 <div className="flex gap-1">
 {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
 <button
 key={p}
 onClick={() => setPage(p)}
 className={`px-3 py-1 text-sm rounded-lg transition ${
 p === page
 ? 'bg-amber-600 text-white'
 : 'text-slate-600 hover:bg-slate-100'
 }`}
 >
 {p}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
};

export default AdminTrails;
