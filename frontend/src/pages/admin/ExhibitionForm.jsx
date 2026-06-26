import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
 adminFetchExhibition,
 adminCreateExhibition,
 adminUpdateExhibition,
 adminFetchArtifacts,
} from '../../api';
import { ArrowLeft, Save, Upload, Plus, X, Gem, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { TextSkeleton } from '../../components/ui/LoadingSkeleton';
const LANGUAGES = ['en', 'fr', 'rw'];
const LANG_LABELS = { en: 'English', fr: 'French', rw: 'Kinyarwanda' };
const TABS = ['Basic Info', 'Artifacts', 'Media', 'Narration', 'Settings', 'Timeline'];

const inputClass =
 'form-input';

const ExhibitionForm = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const isEditing = Boolean(id);

 const [activeTab, setActiveTab] = useState(0);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(isEditing);

 // Language tab states for each multilingual group
 const [titleLang, setTitleLang] = useState('en');
 const [shortDescLang, setShortDescLang] = useState('en');
 const [fullDescLang, setFullDescLang] = useState('en');
 const [significanceLang, setSignificanceLang] = useState('en');

 // Cover preview
 const [coverPreview, setCoverPreview] = useState(null);

 // Artifacts state
 const [availableArtifacts, setAvailableArtifacts] = useState([]);
 const [artifactSearch, setArtifactSearch] = useState('');

 const [form, setForm] = useState({
 title: { en: '', fr: '', rw: '' },
 shortDescription: { en: '', fr: '', rw: '' },
 fullDescription: { en: '', fr: '', rw: '' },
 historicalSignificance: { en: '', fr: '', rw: '' },
 coverImage: null,
 galleryImages: null,
 videoUrls: [''],
 narrationAudio: null,
 previewAudio: null,
 tags: '',
 accessLevel: 'public_preview',
 status: 'draft',
 order: 0,
 timeline: [],
 artifacts: [],
 });

 useEffect(() => {
 if (!isEditing) return;
 const load = async () => {
 try {
 const { data } = await adminFetchExhibition(id);
 const ex = data.exhibition || data;
 setForm({
 title: { en: ex.title?.en || '', fr: ex.title?.fr || '', rw: ex.title?.rw || '' },
 shortDescription: { en: ex.shortDescription?.en || '', fr: ex.shortDescription?.fr || '', rw: ex.shortDescription?.rw || '' },
 fullDescription: { en: ex.fullDescription?.en || '', fr: ex.fullDescription?.fr || '', rw: ex.fullDescription?.rw || '' },
 historicalSignificance: { en: ex.historicalSignificance?.en || '', fr: ex.historicalSignificance?.fr || '', rw: ex.historicalSignificance?.rw || '' },
 coverImage: null,
 galleryImages: null,
 videoUrls: ex.videoUrls?.length ? ex.videoUrls : [''],
 narrationAudio: null,
 previewAudio: null,
 tags: Array.isArray(ex.tags) ? ex.tags.join(', ') : ex.tags || '',
 accessLevel: ex.accessLevel || 'public_preview',
 status: ex.status || 'draft',
 order: ex.order ?? 0,
 timeline: ex.timeline?.length ? ex.timeline : [],
 artifacts: ex.artifacts?.map((a) => (typeof a === 'string' ? a : a._id)) || [],
 });
 if (ex.coverImage) {
 setCoverPreview(ex.coverImage.startsWith('http') ? ex.coverImage : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${ex.coverImage}`);
 }
 } catch (err) {
 toast.error('Failed to load exhibition');
 navigate('/admin/exhibitions');
 } finally {
 setFetching(false);
 }
 };
 load();
 }, [id, isEditing, navigate]);

 // Fetch available artifacts on mount
 useEffect(() => {
 const loadArtifacts = async () => {
 try {
 const { data } = await adminFetchArtifacts();
 setAvailableArtifacts(data.data || data.artifacts || []);
 } catch {
 // silently fail — artifacts list is optional
 }
 };
 loadArtifacts();
 }, []);

 const handleChange = (field, value) => {
 setForm((prev) => ({ ...prev, [field]: value }));
 };

 const handleMultiLang = (field, lang, value) => {
 setForm((prev) => ({
 ...prev,
 [field]: { ...prev[field], [lang]: value },
 }));
 };

 // Video URL helpers
 const addVideoUrl = () => {
 setForm((prev) => ({ ...prev, videoUrls: [...prev.videoUrls, ''] }));
 };

 const removeVideoUrl = (idx) => {
 setForm((prev) => ({
 ...prev,
 videoUrls: prev.videoUrls.filter((_, i) => i !== idx),
 }));
 };

 const updateVideoUrl = (idx, value) => {
 setForm((prev) => {
 const urls = [...prev.videoUrls];
 urls[idx] = value;
 return { ...prev, videoUrls: urls };
 });
 };

 // Timeline helpers
 const addTimelineEntry = () => {
 setForm((prev) => ({
 ...prev,
 timeline: [...prev.timeline, { year: '', event: '' }],
 }));
 };

 const removeTimelineEntry = (idx) => {
 setForm((prev) => ({
 ...prev,
 timeline: prev.timeline.filter((_, i) => i !== idx),
 }));
 };

 const updateTimeline = (idx, field, value) => {
 setForm((prev) => {
 const tl = [...prev.timeline];
 tl[idx] = { ...tl[idx], [field]: value };
 return { ...prev, timeline: tl };
 });
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!form.title.en.trim()) {
 toast.error('Title (English) is required');
 return;
 }
 setLoading(true);

 try {
 const fd = new FormData();

 // Multilingual fields
 ['title', 'shortDescription', 'fullDescription', 'historicalSignificance'].forEach((field) => {
 LANGUAGES.forEach((lang) => {
 fd.append(`${field}[${lang}]`, form[field][lang]);
 });
 });

 // Files
 if (form.coverImage) fd.append('coverImage', form.coverImage);
 if (form.galleryImages) {
 Array.from(form.galleryImages).forEach((f) => fd.append('galleryImages', f));
 }
 if (form.narrationAudio) fd.append('narrationFull', form.narrationAudio);
 if (form.previewAudio) fd.append('narrationPreview', form.previewAudio);

 // Video URLs
 const filteredUrls = form.videoUrls.filter((u) => u.trim());
 filteredUrls.forEach((url) => fd.append('videoUrls[]', url));

 // Settings
 fd.append('accessLevel', form.accessLevel);
 fd.append('status', form.status);
 fd.append('order', form.order);

 // Tags
 const tagsArray = form.tags
 .split(',')
 .map((t) => t.trim())
 .filter(Boolean);
 tagsArray.forEach((tag) => fd.append('tags[]', tag));

 // Timeline
 form.timeline.forEach((entry, i) => {
 fd.append(`timeline[${i}][year]`, entry.year);
 fd.append(`timeline[${i}][event]`, entry.event);
 });

 // Artifacts
 form.artifacts.forEach((id) => fd.append('artifacts[]', id));

 if (isEditing) {
 await adminUpdateExhibition(id, fd);
 toast.success('Exhibition updated');
 } else {
 await adminCreateExhibition(fd);
 toast.success('Exhibition created');
 }
 navigate('/admin/exhibitions');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save exhibition');
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
 onClick={() => navigate('/admin/exhibitions')}
 className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 mb-6 transition"
 >
 <ArrowLeft size={20} /> Back to Exhibitions
 </button>

 <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
 {isEditing ? 'Edit Exhibition' : 'Create Exhibition'}
 </h1>

 {/* Tab Navigation */}
 <div className="flex gap-1 mb-6 overflow-x-auto">
 {TABS.map((tab, idx) => (
 <button
 key={tab}
 type="button"
 onClick={() => setActiveTab(idx)}
 className={`px-4 py-2 text-sm rounded-xl font-medium whitespace-nowrap transition ${
 activeTab === idx
 ? 'bg-amber-600 text-white'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
 }`}
 >
 {tab}
 </button>
 ))}
 </div>

 <form onSubmit={handleSubmit}>
 {/* TAB 0: Basic Info */}
 {activeTab === 0 && (
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
 <div>
 <label className="form-label">Title</label>
 {renderMultiLangInput('title', titleLang, setTitleLang, 'input', 'Exhibition title')}
 </div>
 <div>
 <label className="form-label">Short Description</label>
 {renderMultiLangInput('shortDescription', shortDescLang, setShortDescLang, 'input', 'Short description')}
 </div>
 <div>
 <label className="form-label">Full Description</label>
 {renderMultiLangInput('fullDescription', fullDescLang, setFullDescLang, 'textarea', 'Full description')}
 </div>
 <div>
 <label className="form-label">Historical Significance</label>
 {renderMultiLangInput('historicalSignificance', significanceLang, setSignificanceLang, 'textarea', 'Historical significance')}
 </div>
 </div>
 )}

 {/* TAB 1: Artifacts */}
 {activeTab === 1 && (
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
 <div className="grid md:grid-cols-2 gap-6">
 {/* Available Artifacts */}
 <div>
 <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
 <Gem size={20} className="text-amber-600" /> Available Artifacts
 </h3>
 <div className="relative mb-3">
 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 value={artifactSearch}
 onChange={(e) => setArtifactSearch(e.target.value)}
 className={`${inputClass} pl-10`}
 placeholder="Search artifacts by title..."
 />
 </div>
 <div className="space-y-2 max-h-96 overflow-y-auto">
 {availableArtifacts
 .filter((a) => {
 const n = typeof a.name === 'object' ? (a.name.en || a.name.fr || a.name.rw || '') : (a.name || '');
 return n.toLowerCase().includes(artifactSearch.toLowerCase());
 })
 .map((artifact) => {
 const isSelected = form.artifacts.includes(artifact._id);
 const title = typeof artifact.name === 'object' ? (artifact.name.en || artifact.name.fr || artifact.name.rw || 'Untitled') : (artifact.name || artifact.title?.en || 'Untitled');
 const thumb = artifact.image ? (artifact.image.startsWith('http') ? artifact.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${artifact.image}`) : null;
 return (
 <div
 key={artifact._id}
 className={`flex items-center gap-3 p-3 rounded-xl border transition ${
 isSelected
 ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50'
 : 'border-slate-200 dark:border-slate-700 hover:border-amber-500'
 }`}
 >
 {thumb ? (
 <img src={thumb} alt={title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
 ) : (
 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
 <Gem size={16} className="text-slate-400" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{title}</p>
 {artifact.category && (
 <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{artifact.category}</p>
 )}
 </div>
 <button
 type="button"
 disabled={isSelected}
 onClick={() => handleChange('artifacts', [...form.artifacts, artifact._id])}
 className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Add
 </button>
 </div>
 );
 })}
 {availableArtifacts.length === 0 && (
 <p className="text-slate-500 dark:text-slate-400 text-sm">No artifacts found.</p>
 )}
 </div>
 </div>

 {/* Selected Artifacts */}
 <div>
 <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
 Selected Artifacts ({form.artifacts.length})
 </h3>
 <div className="space-y-2 max-h-96 overflow-y-auto">
 {form.artifacts.map((artId) => {
 const artifact = availableArtifacts.find((a) => a._id === artId);
 const title = artifact
 ? (typeof artifact.name === 'object' ? (artifact.name.en || artifact.name.fr || artifact.name.rw || 'Untitled') : (artifact.name || artifact.title?.en || 'Untitled'))
 : artId;
 const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
 const thumb = artifact?.image ? `${base}${artifact.image}` : null;
 return (
 <div
 key={artId}
 className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
 >
 {thumb ? (
 <img src={thumb} alt={title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
 ) : (
 <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
 <Gem size={16} className="text-slate-400" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{title}</p>
 {artifact?.category && (
 <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{artifact.category}</p>
 )}
 </div>
 <button
 type="button"
 onClick={() => handleChange('artifacts', form.artifacts.filter((aId) => aId !== artId))}
 className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
 >
 <X size={18} />
 </button>
 </div>
 );
 })}
 {form.artifacts.length === 0 && (
 <p className="text-slate-500 dark:text-slate-400 text-sm">No artifacts selected. Add artifacts from the list.</p>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: Media */}
 {activeTab === 2 && (
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
 {/* Cover Image */}
 <div>
 <label className="form-label mb-2">Cover Image</label>
 <div className="flex items-center gap-4">
 {coverPreview && (
 <img src={coverPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />
 )}
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition">
 <Upload size={18} />
 <span>{coverPreview ? 'Change' : 'Upload'}</span>
 <input
 type="file"
 accept="image/*"
 onChange={(e) => {
 const file = e.target.files[0];
 if (file) {
 handleChange('coverImage', file);
 setCoverPreview(URL.createObjectURL(file));
 }
 }}
 className="hidden"
 />
 </label>
 </div>
 </div>

 {/* Gallery Images */}
 <div>
 <label className="form-label mb-2">Gallery Images</label>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
 <Upload size={18} />
 <span>Upload Gallery Images</span>
 <input
 type="file"
 accept="image/*"
 multiple
 onChange={(e) => handleChange('galleryImages', e.target.files)}
 className="hidden"
 />
 </label>
 {form.galleryImages && (
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
 {form.galleryImages.length} file(s) selected
 </p>
 )}
 </div>

 {/* Video URLs */}
 <div>
 <label className="form-label mb-2">Video URLs</label>
 <div className="space-y-2">
 {form.videoUrls.map((url, idx) => (
 <div key={idx} className="flex gap-2">
 <input
 type="text"
 value={url}
 onChange={(e) => updateVideoUrl(idx, e.target.value)}
 className={inputClass}
 placeholder="https://youtube.com/..."
 />
 {form.videoUrls.length > 1 && (
 <button
 type="button"
 onClick={() => removeVideoUrl(idx)}
 className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
 >
 <X size={18} />
 </button>
 )}
 </div>
 ))}
 </div>
 <button
 type="button"
 onClick={addVideoUrl}
 className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 mt-2 font-medium"
 >
 <Plus size={16} /> Add Video URL
 </button>
 </div>
 </div>
 )}

 {/* TAB 3: Narration */}
 {activeTab === 3 && (
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
 <div>
 <label className="form-label mb-2">Full Narration Audio</label>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
 <Upload size={18} />
 <span>Upload Narration Audio</span>
 <input
 type="file"
 accept="audio/*"
 onChange={(e) => handleChange('narrationAudio', e.target.files[0] || null)}
 className="hidden"
 />
 </label>
 {form.narrationAudio && (
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{form.narrationAudio.name}</p>
 )}
 </div>
 <div>
 <label className="form-label mb-2">Preview Audio (15s teaser)</label>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
 <Upload size={18} />
 <span>Upload Preview Audio</span>
 <input
 type="file"
 accept="audio/*"
 onChange={(e) => handleChange('previewAudio', e.target.files[0] || null)}
 className="hidden"
 />
 </label>
 {form.previewAudio && (
 <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{form.previewAudio.name}</p>
 )}
 </div>
 </div>
 )}

 {/* TAB 4: Settings */}
 {activeTab === 4 && (
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <label className="form-label">Tags (comma-separated)</label>
 <input
 type="text"
 value={form.tags}
 onChange={(e) => handleChange('tags', e.target.value)}
 className={inputClass}
 placeholder="art, history, culture"
 />
 </div>
 </div>
 <div className="grid md:grid-cols-3 gap-4">
 <div>
 <label className="form-label">Access Level</label>
 <select
 value={form.accessLevel}
 onChange={(e) => handleChange('accessLevel', e.target.value)}
 className={inputClass}
 >
 <option value="public_preview">Public Preview</option>
 <option value="authenticated">Authenticated</option>
 <option value="museum_access">Museum Access</option>
 </select>
 </div>
 <div>
 <label className="form-label">Status</label>
 <select
 value={form.status}
 onChange={(e) => handleChange('status', e.target.value)}
 className={inputClass}
 >
 <option value="draft">Draft</option>
 <option value="review">Review</option>
 <option value="published">Published</option>
 <option value="archived">Archived</option>
 </select>
 </div>
 <div>
 <label className="form-label">Order</label>
 <input
 type="number"
 value={form.order}
 onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
 className={inputClass}
 min={0}
 />
 </div>
 </div>
 </div>
 )}

 {/* TAB 5: Timeline */}
 {activeTab === 5 && (
 <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Timeline Entries</h2>
 <button
 type="button"
 onClick={addTimelineEntry}
 className="flex items-center gap-1 text-sm bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition font-medium"
 >
 <Plus size={16} /> Add Entry
 </button>
 </div>
 {form.timeline.length === 0 && (
 <p className="text-slate-500 dark:text-slate-400 text-sm">No timeline entries yet. Click "Add Entry" to start.</p>
 )}
 <div className="space-y-3">
 {form.timeline.map((entry, idx) => (
 <div key={idx} className="flex gap-3 items-start">
 <div className="w-28">
 <input
 type="number"
 value={entry.year}
 onChange={(e) => updateTimeline(idx, 'year', e.target.value)}
 className={inputClass}
 placeholder="Year"
 />
 </div>
 <div className="flex-1">
 <input
 type="text"
 value={entry.event}
 onChange={(e) => updateTimeline(idx, 'event', e.target.value)}
 className={inputClass}
 placeholder="Event description"
 />
 </div>
 <button
 type="button"
 onClick={() => removeTimelineEntry(idx)}
 className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
 >
 <X size={18} />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Submit */}
 <div className="flex justify-end mt-6">
 <button
 type="submit"
 disabled={loading}
 className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50"
 >
 <Save size={18} />
 {loading ? 'Saving...' : isEditing ? 'Update Exhibition' : 'Create Exhibition'}
 </button>
 </div>
 </form>
 </div>
 );
};

export default ExhibitionForm;
