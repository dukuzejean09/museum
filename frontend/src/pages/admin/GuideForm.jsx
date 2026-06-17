import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminFetchGuide, adminCreateGuide, adminUpdateGuide } from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Upload, Clock } from 'lucide-react';

import { TextSkeleton } from '../../components/ui/LoadingSkeleton';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
 monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
 thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const inputClass =
 'form-input';

const defaultAvailability = DAYS.map((day) => ({
 day,
 startTime: '09:00',
 endTime: '17:00',
 enabled: false,
}));

const GuideForm = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const isEdit = Boolean(id);

 const [form, setForm] = useState({
 name: '',
 bio: '',
 languages: '',
 specializations: '',
 phone: '',
 email: '',
 });
 const [image, setImage] = useState(null);
 const [preview, setPreview] = useState(null);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(isEdit);
 const [availability, setAvailability] = useState(defaultAvailability);

 useEffect(() => {
 if (!isEdit) return;
 const load = async () => {
 try {
 const { data } = await adminFetchGuide(id);
 setForm({
 name: data.name || '',
 bio: data.bio || '',
 languages: data.languages?.join(', ') || '',
 specializations: data.specializations?.join(', ') || '',
 phone: data.phone || '',
 email: data.email || '',
 });
 if (data.imageUrl) {
 setPreview(data.imageUrl.startsWith('http') ? data.imageUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${data.imageUrl}`);
 }
 // Load availability
 if (data.availability && data.availability.length > 0) {
 const merged = DAYS.map((day) => {
 const existing = data.availability.find((a) => a.day === day);
 return existing
 ? { day, startTime: existing.startTime, endTime: existing.endTime, enabled: true }
 : { day, startTime: '09:00', endTime: '17:00', enabled: false };
 });
 setAvailability(merged);
 }
 } catch {
 toast.error('Failed to load guide');
 navigate('/admin/guides');
 } finally {
 setFetching(false);
 }
 };
 load();
 }, [id, isEdit, navigate]);

 const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

 const handleAvailabilityChange = (index, field, value) => {
 setAvailability((prev) =>
 prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
 );
 };

 const handleFileChange = (e) => {
 const file = e.target.files[0];
 if (file) {
 setImage(file);
 setPreview(URL.createObjectURL(file));
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!form.name.trim()) {
 toast.error('Name is required');
 return;
 }
 setLoading(true);
 try {
 const formData = new FormData();
 formData.append('name', form.name);
 formData.append('bio', form.bio);
 formData.append('languages', form.languages);
 formData.append('specializations', form.specializations);
 formData.append('phone', form.phone);
 formData.append('email', form.email);
 if (image) formData.append('image', image);

 // Build availability array (only enabled days)
 const avail = availability
 .filter((a) => a.enabled)
 .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }));
 formData.append('availability', JSON.stringify(avail));

 if (isEdit) {
 await adminUpdateGuide(id, formData);
 toast.success('Guide updated');
 } else {
 await adminCreateGuide(formData);
 toast.success('Guide created');
 }
 navigate('/admin/guides');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save guide');
 } finally {
 setLoading(false);
 }
 };

 if (fetching) {
 return <TextSkeleton lines={8} />;
 }

 return (
 <div>
 <button
 onClick={() => navigate('/admin/guides')}
 className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 mb-6 transition"
 >
 <ArrowLeft size={20} /> Back to Guides
 </button>

 <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
 {isEdit ? 'Edit' : 'New'} Guide
 </h1>

 <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
 {/* Basic Info */}
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
 <h2 className="section-title">Basic Information</h2>

 {/* Image */}
 <div className="flex items-center gap-6 mb-6">
 <div className="shrink-0">
 {preview ? (
 <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
 ) : (
 <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
 No img
 </div>
 )}
 </div>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition">
 <Upload size={18} />
 <span>{preview ? 'Change Image' : 'Upload Image'}</span>
 <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
 </label>
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <label className="form-label">Name *</label>
 <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="Guide name" />
 </div>
 <div>
 <label className="form-label">Email</label>
 <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="guide@museum.rw" />
 </div>
 <div>
 <label className="form-label">Phone</label>
 <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+250 7XX XXX XXX" />
 </div>
 <div>
 <label className="form-label">Languages (comma-separated)</label>
 <input name="languages" value={form.languages} onChange={handleChange} className={inputClass} placeholder="English, French, Kinyarwanda" />
 </div>
 </div>

 <div className="mt-4">
 <label className="form-label">Specializations (comma-separated)</label>
 <input name="specializations" value={form.specializations} onChange={handleChange} className={inputClass} placeholder="Art History, Colonial Architecture" />
 </div>

 <div className="mt-4">
 <label className="form-label">Bio</label>
 <textarea name="bio" value={form.bio} onChange={handleChange} rows="4" className={inputClass} placeholder="Guide biography..." />
 </div>
 </div>

 {/* Availability Schedule */}
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
 <h2 className="section-title flex items-center gap-2">
 <Clock size={20} />
 Weekly Availability
 </h2>
 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
 Set available hours for each day of the week.
 </p>

 <div className="space-y-3">
 {availability.map((slot, index) => (
 <div
 key={slot.day}
 className={`flex items-center gap-4 p-3 rounded-xl transition ${
 slot.enabled
 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
 : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
 }`}
 >
 <label className="flex items-center gap-3 min-w-[140px] cursor-pointer">
 <input
 type="checkbox"
 checked={slot.enabled}
 onChange={(e) => handleAvailabilityChange(index, 'enabled', e.target.checked)}
 className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300 dark:border-slate-600"
 />
 <span className={`text-sm font-medium ${slot.enabled ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
 {DAY_LABELS[slot.day]}
 </span>
 </label>

 {slot.enabled ? (
 <div className="flex items-center gap-2 flex-1">
 <input
 type="time"
 value={slot.startTime}
 onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
 className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
 />
 <span className="text-slate-400 dark:text-slate-500 text-sm">to</span>
 <input
 type="time"
 value={slot.endTime}
 onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
 className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
 />
 </div>
 ) : (
 <span className="text-sm text-slate-400 dark:text-slate-500 italic">Unavailable</span>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Submit */}
 <div className="flex justify-end">
 <button
 type="submit"
 disabled={loading}
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50"
 >
 <Save size={18} />
 {loading ? 'Saving...' : isEdit ? 'Update Guide' : 'Create Guide'}
 </button>
 </div>
 </form>
 </div>
 );
};

export default GuideForm;
