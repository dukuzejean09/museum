import { useState, useEffect } from 'react';
import { adminGenerateAccessCode, adminFetchAccessCodes, adminDeactivateCode } from '../../api';
import { QrCode, Plus, Copy, Ban, Download, Loader2, Link2, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../../hooks/useRealtimeStore';

const DURATION_PRESETS = [
 { label: '10 minutes', value: 10 / 60, short: '10min' },
 { label: '30 minutes', value: 0.5, short: '30min' },
 { label: '1 hour', value: 1, short: '1hr' },
 { label: '3 hours', value: 3, short: '3hrs' },
 { label: '6 hours', value: 6, short: '6hrs' },
 { label: '10 hours', value: 10, short: '10hrs' },
 { label: '1 day', value: 24, short: '1day' },
 { label: '3 days', value: 72, short: '3days' },
 { label: '10 days', value: 240, short: '10days' },
 { label: '30 days', value: 720, short: '30days' },
];

const TYPE_OPTIONS = [
 { value: 'physical', label: 'Physical (on-site)' },
 { value: 'virtual', label: 'Virtual (online)' },
 { value: 'promotional', label: 'Promotional' },
 { value: 'staff', label: 'Staff' },
];

const formatDuration = (hours) => {
 if (!hours) return '3hrs';
 if (hours < 1) return `${Math.round(hours * 60)}min`;
 if (hours < 24) return `${hours}hr${hours !== 1 ? 's' : ''}`;
 const days = Math.round(hours / 24);
 return `${days}day${days !== 1 ? 's' : ''}`;
};

const AdminAccessCodes = () => {
 const [codes, setCodes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [generating, setGenerating] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [form, setForm] = useState({ label: '', maxUses: '', expiresAt: '', duration: '3', type: 'physical' });
 const [selectedQr, setSelectedQr] = useState(null);

 useRealtimeSync('accessCode', ['admin-access-codes']);

 useEffect(() => {
 loadCodes();
 }, []);

 const loadCodes = async () => {
 try {
 const { data } = await adminFetchAccessCodes();
 setCodes(Array.isArray(data) ? data : data?.data || []);
 } catch (err) {
 toast.error('Failed to load access codes');
 } finally {
 setLoading(false);
 }
 };

 const handleGenerate = async (e) => {
 e.preventDefault();
 setGenerating(true);
 try {
 const payload = {
 label: form.label,
 maxUses: form.maxUses ? Number(form.maxUses) : null,
 expiresAt: form.expiresAt || null,
 duration: form.duration ? Number(form.duration) : 3,
 type: form.type || 'physical',
 };
 const { data } = await adminGenerateAccessCode(payload);
 setCodes(prev => [data, ...prev]);
 setForm({ label: '', maxUses: '', expiresAt: '', duration: '3', type: 'physical' });
 setShowForm(false);
 setSelectedQr({ qrImage: data.qrCodeDataUrl, code: data.code, link: data.gatewayUrl, duration: data.duration, type: data.type, maxUses: data.maxUses });
 toast.success(`Access code generated: ${data.code}`);
 } catch (err) {
 toast.error('Failed to generate access code');
 } finally {
 setGenerating(false);
 }
 };

 const handleDeactivate = async (id) => {
 try {
 await adminDeactivateCode(id);
 setCodes(prev => prev.map(c => c._id === id ? { ...c, isActive: false } : c));
 toast.success('Access code deactivated');
 } catch (err) {
 toast.error('Failed to deactivate code');
 }
 };

 const copyCode = (code) => {
 navigator.clipboard.writeText(code);
 toast.success('Code copied to clipboard');
 };

 const getStatus = (code) => {
 if (!code.isActive) return { label: 'Deactivated', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
 if (code.expiresAt && new Date(code.expiresAt) < new Date()) return { label: 'Expired', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' };
 if (code.maxUses !== null && code.timesUsed >= code.maxUses) return { label: 'Depleted', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
 return { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
 };

 if (loading) {
 return <TableSkeleton />;
 }

 return (
 <div>
 <div className="admin-header">
 <div>
 <h1 className="admin-header-title">Access Codes</h1>
 <p className="page-subtitle">Generate QR codes for visitor access with custom time limits</p>
 </div>
 <button
 onClick={() => setShowForm(!showForm)}
 className="btn btn-primary btn-md"
 >
 <Plus size={18} /> Generate New Code
 </button>
 </div>

 {/* QR Preview Modal */}
 {selectedQr && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedQr(null)}>
 <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center max-w-md w-full" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-bold dark:text-white mb-2">Museum Access Code</h3>
 <div className="flex items-center justify-center gap-3 mb-4 text-sm">
 <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full font-medium">
 <Clock size={14} /> {formatDuration(selectedQr.duration)}
 </span>
 {selectedQr.maxUses && (
 <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full font-medium">
 <Users size={14} /> {selectedQr.maxUses} uses
 </span>
 )}
 <span className="text-slate-400 dark:text-slate-500 capitalize">{selectedQr.type}</span>
 </div>

 {selectedQr.qrImage && (
 <img src={selectedQr.qrImage} alt="QR Code" className="mx-auto mb-4" />
 )}

 <div className="flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500 mb-1">
 <span className="flex-1 border-t border-slate-200 dark:border-slate-700" />
 <span>Scan QR Code or use the code below</span>
 <span className="flex-1 border-t border-slate-200 dark:border-slate-700" />
 </div>

 {/* Access Code Display */}
 <div className="mt-4 mb-3">
 <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
 <code className="flex-1 text-xl font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider">
 {selectedQr.code}
 </code>
 <button
 onClick={() => {
 navigator.clipboard.writeText(selectedQr.code);
 toast.success('Code copied to clipboard');
 }}
 className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
 title="Copy code"
 >
 <Copy size={16} />
 </button>
 </div>
 </div>

 {/* Gateway Link Display */}
 {selectedQr.link && (
 <div className="mb-4">
 <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
 <Link2 size={16} className="shrink-0 text-slate-400" />
 <span className="flex-1 text-xs font-mono text-slate-500 dark:text-slate-400 truncate text-left">
 {selectedQr.link}
 </span>
 <button
 onClick={() => {
 navigator.clipboard.writeText(selectedQr.link);
 toast.success('Link copied to clipboard');
 }}
 className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
 title="Copy link"
 >
 <Copy size={16} />
 </button>
 </div>
 </div>
 )}

 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Print this QR code and display it at the museum entrance</p>
 <div className="flex gap-3 justify-center">
 {selectedQr.qrImage && (
 <a
 href={selectedQr.qrImage}
 download="access-qr-code.png"
 className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition font-medium"
 >
 <Download size={16} /> Download QR
 </a>
 )}
 <button
 onClick={() => setSelectedQr(null)}
 className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Generate Form */}
 {showForm && (
 <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6 space-y-4">
 <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
 <p><strong>Duration</strong> = how long a visitor can browse after scanning (e.g. 10 min, 3 hours)</p>
 <p><strong>Code Expires At</strong> = when the code itself stops working (e.g. after today, after this week)</p>
 <p><strong>Max Uses</strong> = how many people can scan this same code</p>
 </div>
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="form-label">Label (optional)</label>
 <input
 type="text"
 value={form.label}
 onChange={e => setForm({ ...form, label: e.target.value })}
 placeholder="e.g. June 2026 Batch, Entrance Poster..."
 className="form-input"
 />
 </div>
 <div>
 <label className="form-label">Code Type</label>
 <select
 value={form.type}
 onChange={e => setForm({ ...form, type: e.target.value })}
 className="form-input"
 >
 {TYPE_OPTIONS.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium mb-2 dark:text-slate-300">
 <Clock size={14} className="inline mr-1" />
 Access Duration (how long after scanning)
 </label>
 <div className="flex flex-wrap gap-2">
 {DURATION_PRESETS.map(preset => (
 <button
 key={preset.value}
 type="button"
 onClick={() => setForm({ ...form, duration: String(preset.value) })}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
 Number(form.duration) === preset.value
 ? 'bg-amber-600 text-white'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
 }`}
 >
 {preset.label}
 </button>
 ))}
 </div>
 </div>
 <div className="grid sm:grid-cols-2 gap-4">
 <div>
 <label className="form-label">
 <Users size={14} className="inline mr-1" />
 Max Uses / Group Size (optional)
 </label>
 <input
 type="number"
 value={form.maxUses}
 onChange={e => setForm({ ...form, maxUses: e.target.value })}
 placeholder="Leave empty for unlimited"
 min="1"
 className="form-input"
 />
 <p className="text-xs text-slate-400 mt-1">Number of people who can use this code</p>
 </div>
 <div>
 <label className="form-label">Code Expires At (optional)</label>
 <div className="flex flex-wrap gap-1.5 mb-2">
 {[
 { label: 'In 1 hour', hours: 1 },
 { label: 'In 1 day', hours: 24 },
 { label: 'In 1 week', hours: 168 },
 { label: 'In 1 month', hours: 720 },
 { label: 'Never', hours: 0 },
 ].map(opt => (
 <button
 key={opt.label}
 type="button"
 onClick={() => {
 if (opt.hours === 0) {
 setForm({ ...form, expiresAt: '' });
 } else {
 const d = new Date(Date.now() + opt.hours * 3600000);
 const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
 setForm({ ...form, expiresAt: local });
 }
 }}
 className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
 >
 {opt.label}
 </button>
 ))}
 </div>
 <input
 type="datetime-local"
 value={form.expiresAt}
 onChange={e => setForm({ ...form, expiresAt: e.target.value })}
 className="form-input"
 />
 <p className="text-xs text-slate-400 mt-1">When the code itself stops accepting scans</p>
 </div>
 </div>
 <div className="flex gap-3">
 <button
 type="submit"
 disabled={generating}
 className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-xl hover:bg-amber-700 transition font-medium disabled:opacity-50"
 >
 {generating ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
 {generating ? 'Generating...' : 'Generate Code & QR'}
 </button>
 <button
 type="button"
 onClick={() => setShowForm(false)}
 className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
 >
 Cancel
 </button>
 </div>
 </form>
 )}

 {/* Codes Table */}
 {codes.length === 0 ? (
 <div className="text-center py-16 text-slate-500 dark:text-slate-400">
 <QrCode size={48} className="mx-auto mb-4 opacity-50" />
 <p>No access codes generated yet.</p>
 <p className="text-sm mt-1">Click "Generate New Code" to create your first access code.</p>
 </div>
 ) : (
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
 <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Code</th>
 <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Label</th>
 <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Type</th>
 <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Duration</th>
 <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Uses</th>
 <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
 <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Expires</th>
 <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Created</th>
 <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Actions</th>
 </tr>
 </thead>
 <tbody>
 {codes.map(code => {
 const status = getStatus(code);
 return (
 <tr key={code._id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
 <td className="px-4 py-3">
 <code className="font-mono font-bold text-amber-600 dark:text-amber-400">{code.code}</code>
 </td>
 <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{code.label || '—'}</td>
 <td className="px-4 py-3 text-center">
 <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{code.type || 'physical'}</span>
 </td>
 <td className="px-4 py-3 text-center">
 <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
 <Clock size={12} /> {formatDuration(code.duration)}
 </span>
 </td>
 <td className="px-4 py-3 text-center dark:text-slate-300">
 {code.timesUsed}{code.maxUses !== null ? ` / ${code.maxUses}` : ''}
 </td>
 <td className="px-4 py-3 text-center">
 <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
 {status.label}
 </span>
 </td>
 <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
 {code.expiresAt ? new Date(code.expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
 </td>
 <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
 {new Date(code.createdAt).toLocaleDateString()}
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-1 justify-end">
 <button
 onClick={() => copyCode(code.code)}
 className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
 title="Copy code"
 >
 <Copy size={14} />
 </button>
 {code.isActive && (
 <button
 onClick={() => handleDeactivate(code._id)}
 className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"
 title="Deactivate"
 >
 <Ban size={14} />
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
 </div>
 );
};

export default AdminAccessCodes;
