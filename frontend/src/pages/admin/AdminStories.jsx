import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchStories, adminDeleteStory } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
const AdminStories = () => {
 const { isAdmin } = useAuth();
 const [stories, setStories] = useState([]);
 const [loading, setLoading] = useState(true);
 const [statusFilter, setStatusFilter] = useState('all');

 const loadStories = async () => {
 try {
 const { data } = await adminFetchStories();
 setStories(Array.isArray(data) ? data : data.stories || []);
 } catch (err) {
 toast.error('Failed to load stories');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadStories();
 }, []);

 const handleDelete = async (id, title) => {
 if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
 try {
 await adminDeleteStory(id);
 toast.success('Story deleted');
 loadStories();
 } catch (err) {
 toast.error('Failed to delete story');
 }
 };

 const filtered =
 statusFilter === 'all'
 ? stories
 : stories.filter((s) => s.status === statusFilter);

 if (loading) {
 return <TableSkeleton />;
 }

 return (
 <div>
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-2xl font-bold text-gray-800">Stories</h1>
 <Link
 to="/admin/stories/new"
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition font-medium"
 >
 <Plus size={20} /> Create Story
 </Link>
 </div>

 {/* Filter */}
 <div className="mb-4">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
 >
 <option value="all">All Status</option>
 <option value="draft">Draft</option>
 <option value="published">Published</option>
 <option value="archived">Archived</option>
 </select>
 </div>

 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
 <table className="w-full">
 <thead className="bg-slate-50 border-b border-slate-200">
 <tr>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Title</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Exhibition</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Status</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Created</th>
 <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filtered.map((story) => {
 const linkedTo = story.exhibitionId?.title?.en || '-';
 return (
 <tr key={story._id} className="hover:bg-slate-50">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
 <BookOpen size={18} />
 </div>
 <span className="font-medium text-slate-800">
 {story.title?.en || story.title || '-'}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-slate-600">
 {linkedTo}
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={story.status || 'draft'} />
 </td>
 <td className="px-6 py-4 text-slate-600 text-sm">
 {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : '-'}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <Link
 to={`/admin/stories/edit/${story._id}`}
 className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
 title="Edit"
 >
 <Edit size={18} />
 </Link>
 {isAdmin && (
 <button
 onClick={() => handleDelete(story._id, story.title?.en || story.title)}
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
 {filtered.length === 0 && (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
 No stories found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
};

export default AdminStories;
