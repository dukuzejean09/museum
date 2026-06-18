import { useState, useEffect } from 'react';
import { fetchUsers, registerAdmin, updateUserRole, toggleUserStatus, deleteUser } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Trash2, Shield, UserCheck, UserX, Users, UserCog, Mail, Phone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';

/** Validate Rwandan phone: 07[2389]XXXXXXX or +2507[2389]XXXXXXX */
const isValidRwandanPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+?250|0)?7[2389]\d{7}$/.test(cleaned);
};

const AdminUsers = () => {
  const { admin } = useAuth();
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ total: 0, admins: 0, guides: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', role: 'guide',
    profile: { firstName: '', lastName: '', phone: '' },
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      const { data } = await fetchUsers();
      setUsers(data.users);
      setCounts(data.counts);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.profile.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.profile.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.username.trim() || formData.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) errors.username = 'Letters, numbers, and underscores only';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password || formData.password.length < 6) errors.password = 'Min 6 characters';
    if (!formData.profile.phone.trim()) errors.phone = 'Phone number is required';
    else if (!isValidRwandanPhone(formData.profile.phone)) errors.phone = 'Invalid Rwandan number (07X XXXX XXX)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await registerAdmin(formData);
      toast.success(`${formData.role === 'admin' ? 'Admin' : 'Guide'} created — credentials sent via email`);
      setFormData({ username: '', email: '', password: '', role: 'guide', profile: { firstName: '', lastName: '', phone: '' } });
      setFormErrors({});
      setShowAddForm(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await updateUserRole(id, { role: newRole });
      toast.success('Role updated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (id, username) => {
    try {
      await toggleUserStatus(id);
      toast.success(`${username} status updated`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">User Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition font-medium"
        >
          <UserPlus size={20} /> Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Users size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{counts.total}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Shield size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Admins</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{counts.admins}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
            <UserCog size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Guides</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{counts.guides}</p>
          </div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Add New User</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="form-label">First Name *</label>
              <input
                type="text"
                required
                value={formData.profile.firstName}
                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, firstName: e.target.value } })}
                className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white`}
                placeholder="First name"
              />
              {formErrors.firstName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.firstName}</p>}
            </div>
            {/* Last Name */}
            <div>
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                required
                value={formData.profile.lastName}
                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, lastName: e.target.value } })}
                className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white`}
                placeholder="Last name"
              />
              {formErrors.lastName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.lastName}</p>}
            </div>
            {/* Username */}
            <div>
              <label className="form-label">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full px-3 py-2 border ${formErrors.username ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white`}
                placeholder="Letters, numbers, underscores"
              />
              {formErrors.username && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.username}</p>}
            </div>
            {/* Email */}
            <div>
              <label className="form-label">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white`}
                placeholder="user@example.com"
              />
              {formErrors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.email}</p>}
            </div>
            {/* Phone (Rwandan) */}
            <div>
              <label className="form-label flex items-center gap-1"><Phone size={14} /> Phone (Rwanda) *</label>
              <input
                type="tel"
                required
                value={formData.profile.phone}
                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, phone: e.target.value } })}
                className={`w-full px-3 py-2 border ${formErrors.phone ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white`}
                placeholder="07XXXXXXXX or +2507XXXXXXXX"
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.phone}</p>}
            </div>
            {/* Password */}
            <div>
              <label className="form-label">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 border ${formErrors.password ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white`}
                placeholder="Min 6 characters"
              />
              {formErrors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.password}</p>}
            </div>
            {/* Role */}
            <div>
              <label className="form-label">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="admin">Admin</option>
                <option value="guide">Guide</option>
              </select>
            </div>
            {/* Info note */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                <Mail size={16} className="flex-shrink-0" />
                Login credentials will be sent to the user's email automatically.
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition font-medium disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setFormErrors({}); }}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden !p-0">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Username</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Role</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map((user) => {
              const isSelf = user._id === admin?._id;
              const canManage = !isSelf && !user.isProtected;
              return (
                <tr key={user._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${isSelf ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                    {user.username}
                    {isSelf && (
                      <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">You</span>
                    )}
                    {user.isProtected && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Shield className="inline w-3 h-3 mr-0.5 -mt-0.5" />Protected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    {canManage ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="guide">Guide</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.username)}
                          className={`p-2 rounded-lg transition ${
                            user.isActive
                              ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
