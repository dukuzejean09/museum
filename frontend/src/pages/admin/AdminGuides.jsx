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
      <div className="admin-header">
        <h1 className="admin-header-title">Guides</h1>
        <Link
          to="/admin/guides/new"
          className="btn btn-primary btn-md"
        >
          <Plus size={20} /> Add Guide
        </Link>
      </div>

      <div className="card overflow-hidden !p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Bio</th>
              <th>Languages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide._id}>
                <td>
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
                <td className="td-bold">{guide.name}</td>
                <td className="td-muted max-w-xs truncate">{guide.bio}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {guide.languages?.map((lang) => (
                      <span key={lang} className="tag">
                        {lang}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/admin/guides/edit/${guide._id}`}
                      className="action-btn action-btn-edit"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(guide._id, guide.name)}
                        className="action-btn action-btn-delete"
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
                <td colSpan="5" className="td-empty">
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
