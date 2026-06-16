import { useState, useEffect } from 'react';
import { guideFetchProfile, guideUpdateProfile } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Save, Upload, Clock, User, Mail, Phone, Globe, Star } from 'lucide-react';

import { TextSkeleton } from '../../components/ui/LoadingSkeleton';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
 monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
 thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const inputClass =
 'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none';

const defaultAvailability = DAYS.map((day) => ({
 day,
 startTime: '09:00',
 endTime: '17:00',
 enabled: false,
}));

const GuideProfile = () => {
 const { admin } = useAuth();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [image, setImage] = useState(null);
 const [preview, setPreview] = useState(null);
 const [notLinked, setNotLinked] = useState(false);

 const [form, setForm] = useState({
 name: '',
 bio: '',
 languages: '',
 specializations: '',
 phone: '',
 email: '',
 });

 const [availability, setAvailability] = useState(defaultAvailability);

 useEffect(() => {
 const loadProfile = async () => {
 try {
 const { data } = await guideFetchProfile();
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

 // Merge existing availability with defaults
 if (data.availability && data.availability.length > 0) {
 const merged = DAYS.map((day) => {
 const existing = data.availability.find((a) => a.day === day);
 return existing
 ? { day, startTime: existing.startTime, endTime: existing.endTime, enabled: true }
 : { day, startTime: '09:00', endTime: '17:00', enabled: false };
 });
 setAvailability(merged);
 }
 } catch (err) {
 if (err.response?.status === 404) {
 setNotLinked(true);
 } else {
 toast.error('Failed to load profile');
 }
 } finally {
 setLoading(false);
 }
 };
 loadProfile();
 }, []);

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
 setSaving(true);
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

 await guideUpdateProfile(formData);
 toast.success('Profile updated successfully');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to update profile');
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return <TextSkeleton lines={8} />;
 }

 if (notLinked) {
 return (
 <div className="max-w-2xl mx-auto">
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
 <User size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
 <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
 No Guide Profile Linked
 </h2>
 <p className="text-slate-600 dark:text-slate-400">
 Your account is not linked to a guide profile yet. Please ask an administrator to create
 a guide record and link it to your account.
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto">
 <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
 <User size={28} />
 My Guide Profile
 </h1>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Profile Image & Basic Info */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
 <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Basic Information</h2>

 {/* Image */}
 <div className="flex items-center gap-6 mb-6">
 <div className="shrink-0">
 {preview ? (
 <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
 ) : (
 <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
 <User size={32} className="text-slate-400 dark:text-slate-500" />
 </div>
 )}
 </div>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition">
 <Upload size={18} />
 <span>{preview ? 'Change Photo' : 'Upload Photo'}</span>
 <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
 </label>
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 <span className="flex items-center gap-1"><User size={14} /> Name *</span>
 </label>
 <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="Your full name" />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 <span className="flex items-center gap-1"><Mail size={14} /> Email</span>
 </label>
 <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="guide@museum.rw" />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 <span className="flex items-center gap-1"><Phone size={14} /> Phone</span>
 </label>
 <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+250 7XX XXX XXX" />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 <span className="flex items-center gap-1"><Globe size={14} /> Languages</span>
 </label>
 <input name="languages" value={form.languages} onChange={handleChange} className={inputClass} placeholder="English, French, Kinyarwanda" />
 </div>
 </div>

 <div className="mt-4">
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 <span className="flex items-center gap-1"><Star size={14} /> Specializations</span>
 </label>
 <input name="specializations" value={form.specializations} onChange={handleChange} className={inputClass} placeholder="Art History, Colonial Architecture, Traditional Crafts" />
 </div>

 <div className="mt-4">
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
 <textarea
 name="bio"
 value={form.bio}
 onChange={handleChange}
 rows="4"
 className={inputClass}
 placeholder="Tell visitors about yourself, your experience, and what makes your tours special..."
 />
 </div>
 </div>

 {/* Availability Schedule */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
 <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
 <Clock size={20} />
 Weekly Availability
 </h2>
 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
 Set your available hours for each day of the week.
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
 disabled={saving}
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50"
 >
 <Save size={18} />
 {saving ? 'Saving...' : 'Save Profile'}
 </button>
 </div>
 </form>
 </div>
 );
};

export default GuideProfile;
