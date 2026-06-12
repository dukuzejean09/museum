import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
 adminFetchArtifact,
 adminCreateArtifact,
 adminUpdateArtifact,
} from '../../api';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import { TextSkeleton } from '../../components/ui/LoadingSkeleton';
const LANGUAGES = ['en', 'fr', 'rw'];
const LANG_LABELS = { en: 'English', fr: 'French', rw: 'Kinyarwanda' };

const inputClass =
 'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none';

const ArtifactForm = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const isEditing = Boolean(id);

 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(isEditing);

 const [nameLang, setNameLang] = useState('en');
 const [descLang, setDescLang] = useState('en');
 const [storyLang, setStoryLang] = useState('en');
 const [originLang, setOriginLang] = useState('en');

 const [imagePreview, setImagePreview] = useState(null);

 const [form, setForm] = useState({
 name: { en: '', fr: '', rw: '' },
 description: { en: '', fr: '', rw: '' },
 historicalStory: { en: '', fr: '', rw: '' },
 originLocation: { en: '', fr: '', rw: '' },
 dateCreated: '',
 dateDiscovered: '',
 category: '',
 image: null,
 additionalImages: null,
 status: 'draft',
 });

 useEffect(() => {
 if (!isEditing) return;
 const load = async () => {
 try {
 const { data } = await adminFetchArtifact(id);
 const a = data.artifact || data;
 setForm({
 name: { en: a.name?.en || '', fr: a.name?.fr || '', rw: a.name?.rw || '' },
 description: { en: a.description?.en || '', fr: a.description?.fr || '', rw: a.description?.rw || '' },
 historicalStory: { en: a.historicalStory?.en || '', fr: a.historicalStory?.fr || '', rw: a.historicalStory?.rw || '' },
 originLocation: { en: a.originLocation?.en || '', fr: a.originLocation?.fr || '', rw: a.originLocation?.rw || '' },
 dateCreated: a.dateCreated || '',
 dateDiscovered: a.dateDiscovered || '',
 category: a.category || '',
 image: null,
 additionalImages: null,
 status: a.status || 'draft',
 });
 if (a.image) {
 setImagePreview(a.image.startsWith('http') ? a.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${a.image}`);
 }
 } catch (err) {
 toast.error('Failed to load artifact');
 navigate('/admin/artifacts');
 } finally {
 setFetching(false);
 }
 };
 load();
 }, [id, isEditing, navigate]);

 const handleChange = (field, value) => {
 setForm((prev) => ({ ...prev, [field]: value }));
 };

 const handleMultiLang = (field, lang, value) => {
 setForm((prev) => ({
 ...prev,
 [field]: { ...prev[field], [lang]: value },
 }));
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!form.name.en.trim()) {
 toast.error('Name (English) is required');
 return;
 }
 setLoading(true);

 try {
 const fd = new FormData();

 ['name', 'description', 'historicalStory', 'originLocation'].forEach((field) => {
 LANGUAGES.forEach((lang) => {
 fd.append(`${field}[${lang}]`, form[field][lang]);
 });
 });

 fd.append('dateCreated', form.dateCreated);
 fd.append('dateDiscovered', form.dateDiscovered);
 fd.append('category', form.category);
 fd.append('status', form.status);

 if (form.image) fd.append('image', form.image);
 if (form.additionalImages) {
 Array.from(form.additionalImages).forEach((f) => fd.append('additionalImages', f));
 }

 if (isEditing) {
 await adminUpdateArtifact(id, fd);
 toast.success('Artifact updated');
 } else {
 await adminCreateArtifact(fd);
 toast.success('Artifact created');
 }
 navigate('/admin/artifacts');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save artifact');
 } finally {
 setLoading(false);
 }
 };

 const renderLangTabs = (current, setCurrent) => (
 <div className="flex gap-1 mb-2">
 {LANGUAGES.map((lang) => (
 <button
 key={lang}
 type="button"
 onClick={() => setCurrent(lang)}
 className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
 current === lang
 ? 'bg-amber-600 text-white'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 {LANG_LABELS[lang]}
 </button>
 ))}
 </div>
 );

 const renderMultiLangInput = (field, langState, setLangState, type = 'input', placeholder = '') => (
 <div>
 {renderLangTabs(langState, setLangState)}
 {LANGUAGES.map((lang) =>
 type === 'textarea' ? (
 <textarea
 key={lang}
 value={form[field][lang]}
 onChange={(e) => handleMultiLang(field, lang, e.target.value)}
 className={`${inputClass} min-h-[120px] ${langState !== lang ? 'hidden' : ''}`}
 placeholder={`${placeholder} (${LANG_LABELS[lang]})`}
 rows={5}
 />
 ) : (
 <input
 key={lang}
 type="text"
 value={form[field][lang]}
 onChange={(e) => handleMultiLang(field, lang, e.target.value)}
 className={`${inputClass} ${langState !== lang ? 'hidden' : ''}`}
 placeholder={`${placeholder} (${LANG_LABELS[lang]})`}
 />
 )
 )}
 </div>
 );

 if (fetching) {
 return <TextSkeleton lines={8} />;
 }

 return (
 <div>
 <button
 onClick={() => navigate('/admin/artifacts')}
 className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 mb-6 transition"
 >
 <ArrowLeft size={20} /> Back to Artifacts
 </button>

 <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
 {isEditing ? 'Edit Artifact' : 'Create Artifact'}
 </h1>

 <form onSubmit={handleSubmit}>
 {/* Name & Description */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 Artifact Name <span className="text-red-500">*</span>
 </label>
 {renderMultiLangInput('name', nameLang, setNameLang, 'input', 'Artifact name')}
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 Short Description <span className="text-red-500">*</span>
 </label>
 {renderMultiLangInput('description', descLang, setDescLang, 'textarea', 'Short description')}
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
 Historical Story <span className="text-red-500">*</span>
 </label>
 {renderMultiLangInput('historicalStory', storyLang, setStoryLang, 'textarea', 'Historical story')}
 </div>
 </div>

 {/* Optional Fields */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6 mt-6">
 <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Optional Details</h2>
 <div className="grid md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Created</label>
 <input
 type="text"
 value={form.dateCreated}
 onChange={(e) => handleChange('dateCreated', e.target.value)}
 className={inputClass}
 placeholder="e.g. 1920, 18th century"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Discovered / Collected</label>
 <input
 type="text"
 value={form.dateDiscovered}
 onChange={(e) => handleChange('dateDiscovered', e.target.value)}
 className={inputClass}
 placeholder="e.g. 1994, Unknown"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
 <input
 type="text"
 value={form.category}
 onChange={(e) => handleChange('category', e.target.value)}
 className={inputClass}
 placeholder="e.g. Pottery, Weapon, Document"
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origin / Location</label>
 {renderMultiLangInput('originLocation', originLang, setOriginLang, 'input', 'Origin or location')}
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
 <select
 value={form.status}
 onChange={(e) => handleChange('status', e.target.value)}
 className={inputClass}
 >
 <option value="draft">Draft</option>
 <option value="published">Published</option>
 <option value="archived">Archived</option>
 </select>
 </div>
 </div>

 {/* Images */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6 mt-6">
 <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Images</h2>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 Artifact Image <span className="text-red-500">*</span>
 </label>
 <div className="flex items-center gap-4">
 {imagePreview && (
 <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />
 )}
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition">
 <Upload size={18} />
 <span>{imagePreview ? 'Change' : 'Upload'}</span>
 <input
 type="file"
 accept="image/*"
 onChange={(e) => {
 const file = e.target.files[0];
 if (file) {
 handleChange('image', file);
 setImagePreview(URL.createObjectURL(file));
 }
 }}
 className="hidden"
 />
 </label>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Additional Images</label>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
 <Upload size={18} />
 <span>Upload Images</span>
 <input
 type="file"
 accept="image/*"
 multiple
 onChange={(e) => handleChange('additionalImages', e.target.files)}
 className="hidden"
 />
 </label>
 {form.additionalImages && (
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
 {form.additionalImages.length} file(s) selected
 </p>
 )}
 </div>
 </div>

 {/* Submit */}
 <div className="flex justify-end mt-6">
 <button
 type="submit"
 disabled={loading}
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50"
 >
 <Save size={18} />
 {loading ? 'Saving...' : isEditing ? 'Update Artifact' : 'Create Artifact'}
 </button>
 </div>
 </form>
 </div>
 );
};

export default ArtifactForm;
