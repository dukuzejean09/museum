import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers, adminDeleteGuide } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';

const AdminGuides = () => {
  const { isAdmin } = useAuth();
  const [guideUsers, setGuideUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useRealtimeSync('guide', ['admin-guides']);
  useRealtimeSync('user', ['admin-guides']);

  const loadGuides = async () => {
    try {
      const { data } = await fetchUsers();
      // Filter to only guide-role users (they now have guideProfile attached)
      setGuideUsers(data.users.filter((u) => u.role === 'guide'));
    } catch (err) {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGuides(); }, []);

  const handleDelete = async (user) => {
    const name = user.guideProfile?.name || user.username;
    if (!window.confirm(`Delete guide "${name}"? This will also remove their user account.`)) return;
    try {
      if (user.guideProfile?._id) {
        await adminDeleteGuide(user.guideProfile._id);
      }
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
              <th>Contact</th>
              <th>Languages</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guideUsers.map((user) => {
              const gp = user.guideProfile;
              const name = gp?.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username;
              const imageUrl = gp?.imageUrl;
              return (
                <tr key={user._id}>
                  <td>
                    {imageUrl ? (
                      <img
                        src={imageUrl.startsWith('http') ? imageUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl}`}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <span className="td-bold block">{name}</span>
                      {gp?.bio && <span className="td-muted text-xs block max-w-xs truncate">{gp.bio}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Mail size={14} /> {user.email}
                      </div>
                      {(gp?.phone || user.profile?.phone) && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone size={14} /> {gp?.phone || user.profile?.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {gp?.languages?.map((lang) => (
                        <span key={lang} className="tag">{lang}</span>
                      ))}
                      {(!gp?.languages || gp.languages.length === 0) && (
                        <span className="td-muted text-xs">Not set</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {gp?._id && (
                        <Link
                          to={`/admin/guides/edit/${gp._id}`}
                          className="action-btn action-btn-edit"
                          title="Edit Guide Profile"
                        >
                          <Edit size={18} />
                        </Link>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="action-btn action-btn-delete"
                          title="Delete Guide & User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {guideUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="td-empty">
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
