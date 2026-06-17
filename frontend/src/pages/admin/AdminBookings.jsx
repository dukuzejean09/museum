import { useState, useEffect } from 'react';
import { adminFetchBookings, adminUpdateBooking, adminGenerateBookingAccess, adminDeleteBooking } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Trash2, Clock, Key, Copy, Download, X, Globe, MapPin, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

const typeStyles = {
  physical: { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', icon: MapPin, label: 'In-Person' },
  online: { bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', icon: Globe, label: 'Online' },
};

const AdminBookings = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, physical, online
  const [accessModal, setAccessModal] = useState(null); // { qrCodeDataUrl, gatewayUrl, code }

  const loadBookings = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.visitType = filter;
      const { data } = await adminFetchBookings(params);
      setBookings(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [filter]);

  const handleStatus = async (id, status) => {
    try {
      const { data } = await adminUpdateBooking(id, { status });
      toast.success(`Booking ${status}`);
      // If confirming an online booking, show the access code modal
      if (status === 'confirmed' && data.qrCodeDataUrl) {
        setAccessModal({
          qrCodeDataUrl: data.qrCodeDataUrl,
          gatewayUrl: data.gatewayUrl,
          code: data.accessCodeId?.code || '',
        });
      }
      loadBookings();
    } catch {
      toast.error('Failed to update booking');
    }
  };

  const handleGrantAccess = async (id) => {
    try {
      const { data } = await adminGenerateBookingAccess(id, {});
      toast.success('Access code generated!');
      setAccessModal({
        qrCodeDataUrl: data.qrCodeDataUrl,
        gatewayUrl: data.gatewayUrl,
        code: data.accessCode?.code || '',
      });
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate access code');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this booking?')) return;
    try {
      await adminDeleteBooking(id);
      toast.success('Booking deleted');
      setBookings(prev => prev.filter(b => b._id !== id));
    } catch {
      toast.error('Failed to delete booking');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const downloadQr = (dataUrl, code) => {
    const link = document.createElement('a');
    link.download = `access-${code}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Bookings & Access Requests</h1>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'physical', label: 'Tours' },
            { key: 'online', label: 'Online' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setLoading(true); setFilter(f.key); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filter === f.key ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-8 text-center text-slate-500 dark:text-slate-400">
          <Clock size={48} className="mx-auto mb-3 opacity-50" />
          <p>No bookings yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Visitor</th>
                  <th className="px-4 py-3 text-left">Guide</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Group</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Access</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {bookings.map(b => {
                  const vType = typeStyles[b.visitType] || typeStyles.physical;
                  const TypeIcon = vType.icon;
                  return (
                    <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${vType.bg}`}>
                          <TypeIcon size={12} /> {vType.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{b.visitorName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{b.visitorEmail}</p>
                          {b.visitorPhone && <p className="text-xs text-slate-400 dark:text-slate-500">{b.visitorPhone}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {b.guideId?.name || (b.visitType === 'online' ? '—' : 'Unknown')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800 dark:text-slate-200">{new Date(b.date).toLocaleDateString()}</p>
                        {b.time && <p className="text-xs text-slate-500 dark:text-slate-400">{b.time}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.groupSize}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[b.status] || 'bg-slate-100 dark:bg-slate-800'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {b.accessCodeId ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg">
                            <Key size={12} /> {b.accessCodeId.code}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatus(b._id, 'confirmed')}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Confirm"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleStatus(b._id, 'rejected')}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          {!b.accessCodeId && b.status !== 'rejected' && b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleGrantAccess(b._id)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              title="Grant Access Code"
                            >
                              <QrCode size={18} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(b._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600"
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Special requests */}
      {bookings.filter(b => b.message).length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">Special Requests & Messages</h2>
          <div className="space-y-3">
            {bookings.filter(b => b.message).map(b => (
              <div key={b._id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{b.visitorName}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${(typeStyles[b.visitType] || typeStyles.physical).bg}`}>
                    {(typeStyles[b.visitType] || typeStyles.physical).label}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Code Modal */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAccessModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Access Code Generated</h3>
              <button onClick={() => setAccessModal(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} className="dark:text-slate-400" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <img src={accessModal.qrCodeDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
            </div>

            {/* Code */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Access Code</p>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg text-slate-800 dark:text-slate-200">{accessModal.code}</span>
                <button onClick={() => copyToClipboard(accessModal.code)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700" title="Copy">
                  <Copy size={16} className="dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Gateway Link */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gateway Link</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 truncate">{accessModal.gatewayUrl}</span>
                <button onClick={() => copyToClipboard(accessModal.gatewayUrl)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0" title="Copy">
                  <Copy size={16} className="dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={() => downloadQr(accessModal.qrCodeDataUrl, accessModal.code)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition"
            >
              <Download size={16} /> Download QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
