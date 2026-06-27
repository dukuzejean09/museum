import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchTrails, adminDeleteTrail } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, Star, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';
const ITEMS_PER_PAGE = 10;

const AdminTrails = () => {
 const { isAdmin } = useAuth();
 const [trails, setTrails] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [page, setPage] = useState(1);

 useRealtimeSync('trail', ['admin-trails']);

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
 easy: 'bg-green-900/20 text-green-400',
 moderate: 'bg-yellow-900/20 text-yellow-400',
 detailed: 'bg-red-900/20 text-red-400',
 };
 return (
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[level] || colors.easy}`}>
 {level || 'easy'}
 </span>
 );
 };

 const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
 const imgUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${baseUrl}${path}`;
 };

 if (loading) {
 return <TableSkeleton />;
 }

 return (
 <div>
 <div className="admin-header">
 <h1 className="admin-header-title">Trails</h1>
 <div className="admin-header-actions">
 {/* Search */}
 <div className="search-wrap">
 <Search size={16} className="search-icon" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search trails..."
 className="form-input"
 />
 </div>
 <Link
 to="/admin/trails/new"
 className="btn btn-primary btn-md"
 >
 <Plus size={20} /> Add Trail
 </Link>
 </div>
 </div>

 <div className="card overflow-hidden !p-0">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-slate-800 border-b border-slate-700">
 <tr>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Cover
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Title
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Difficulty
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Duration
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Stops
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Featured
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Status
 </th>
 <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {paginated.map((trail) => {
 const title = trail.title?.en || trail.title || 'Untitled';
 const stopCount = trail.stopCount ?? trail.stops?.length ?? 0;

 return (
 <tr key={trail._id} className="hover:bg-slate-800/50 transition">
 {/* Cover */}
 <td className="px-4 py-3">
 {trail.coverImage ? (
 <img
 src={imgUrl(trail.coverImage)}
 alt=""
 className="w-12 h-12 rounded-lg object-cover"
 />
 ) : (
 <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
 <MapPin size={18} className="text-slate-400" />
 </div>
 )}
 </td>

 {/* Title */}
 <td className="px-4 py-3">
 <span className="font-medium text-white">{title}</span>
 </td>

 {/* Difficulty */}
 <td className="px-4 py-3">{difficultyBadge(trail.difficulty)}</td>

 {/* Duration */}
 <td className="px-4 py-3">
 <span className="flex items-center gap-1 text-sm text-slate-400">
 <Clock size={14} />
 {trail.estimatedMinutes || 30} min
 </span>
 </td>

 {/* Stops */}
 <td className="px-4 py-3">
 <span className="text-sm text-slate-400">{stopCount}</span>
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
 ? 'bg-green-900/20 text-green-400'
 : 'bg-slate-800 text-slate-400'
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
 className="p-2 text-amber-600 hover:bg-amber-900/20 rounded-lg transition"
 title="Edit"
 >
 <Edit size={18} />
 </Link>
 {isAdmin && (
 <button
 onClick={() => handleDelete(trail._id, title)}
 className="p-2 text-red-600 hover:bg-red-900/20 rounded-lg transition"
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
 <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
 {search ? 'No trails match your search.' : 'No trails found. Add your first trail!'}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
 <span className="text-sm text-slate-400">
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
 : 'text-slate-400 hover:bg-slate-800'
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
