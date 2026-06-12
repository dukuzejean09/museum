import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminFetchGuides, adminDeleteGuide } from '../../api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminGuides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGuides = async () => {
    try {
      const { data } = await adminFetchGuides();
      setGuides(data);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Guides</h1>
        <Link
          to="/admin/guides/new"
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition font-medium"
        >
          <Plus size={20} /> Add Guide
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Bio</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Languages</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {guides.map((guide) => (
              <tr key={guide._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {guide.imageUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${guide.imageUrl}`}
                      alt={guide.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">{guide.name}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{guide.bio}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {guide.languages?.map((lang) => (
                      <span key={lang} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/guides/edit/${guide._id}`}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(guide._id, guide.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {guides.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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
