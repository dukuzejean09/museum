import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchGuides, adminDeleteGuide } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';
const AdminGuides = () => {
  const { isAdmin } = useAuth();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useRealtimeSync('guide', ['admin-guides']);

  const loadGuides = async () => {
    try {
      const { data } = await adminFetchGuides();
      setGuides(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGuides(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await adminDeleteGuide(id);
      toast.success('Guide deleted');
      loadGuides();
    } catch (err) {
      toast.error('Failed to delete guide');
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Guides</h1>
        <Link
          to="/admin/guides/new"
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition font-medium"
        >
          <Plus size={20} /> Add Guide
        </Link>
      </div>

      <div className="card overflow-hidden !p-0">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Image</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Bio</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Languages</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {guides.map((guide) => (
              <tr key={guide._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4">
                  {guide.imageUrl ? (
                    <img
                      src={guide.imageUrl?.startsWith('http') ? guide.imageUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${guide.imageUrl}`}
                      alt={guide.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                      No img
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{guide.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{guide.bio}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {guide.languages?.map((lang) => (
                      <span key={lang} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/guides/edit/${guide._id}`}
                      className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(guide._id, guide.name)}
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
            {guides.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No guides found. Add your first guide!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGuides;
