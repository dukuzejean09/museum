import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
 adminFetchTrail,
 adminCreateTrail,
 adminUpdateTrail,
 adminFetchArtifacts,
} from '../../api';
import toast from 'react-hot-toast';
import { TextSkeleton } from '../../components/ui/LoadingSkeleton';
import {
 ArrowLeft,
 Save,
 Upload,
 Plus,
 X,
 GripVertical,
 ChevronUp,
 ChevronDown,
 Search,
} from 'lucide-react';

const LANGUAGES = ['en', 'fr', 'rw'];
const LANG_LABELS = { en: 'English', fr: 'French', rw: 'Kinyarwanda' };
const TABS = ['Basic Info', 'Stops', 'Media', 'Settings'];

const inputClass =
 'form-input';

const emptyMultilang = () => ({ en: '', fr: '', rw: '' });

const TrailForm = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const isEditing = Boolean(id);

 const [activeTab, setActiveTab] = useState(0);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(isEditing);

 // Language tab states
 const [titleLang, setTitleLang] = useState('en');
 const [introLang, setIntroLang] = useState('en');
 const [descLang, setDescLang] = useState('en');

 // Cover preview
 const [coverPreview, setCoverPreview] = useState(null);

 // Artifacts for stop selector
 const [artifacts, setArtifacts] = useState([]);
 const [artifactSearch, setArtifactSearch] = useState('');

 const [form, setForm] = useState({
 title: emptyMultilang(),
 introduction: emptyMultilang(),
 description: emptyMultilang(),
 coverImage: null,
 audio: null,
 video: null,
 stops: [],
 tags: '',
 estimatedMinutes: 30,
 difficulty: 'easy',
 isFeatured: false,
 isActive: true,
 });

 // Load artifacts list
 useEffect(() => {
 const loadArtifacts = async () => {
 try {
 const { data } = await adminFetchArtifacts({ limit: 500 });
 setArtifacts(data.data || data || []);
 } catch {
 // silent — artifact selector will just be empty
 }
 };
 loadArtifacts();
 }, []);

 // Load trail data for editing
 useEffect(() => {
 if (!isEditing) return;
 const load = async () => {
 try {
 const { data: trail } = await adminFetchTrail(id);
 const t = trail.trail || trail;
 setForm({
 title: { en: t.title?.en || '', fr: t.title?.fr || '', rw: t.title?.rw || '' },
 introduction: { en: t.introduction?.en || '', fr: t.introduction?.fr || '', rw: t.introduction?.rw || '' },
 description: { en: t.description?.en || '', fr: t.description?.fr || '', rw: t.description?.rw || '' },
 coverImage: null,
 stops: (t.stops || []).map((s, i) => ({
 order: s.order ?? i + 1,
 artifactId: s.artifactId?._id || s.artifactId || '',
 description: {
 en: s.description?.en || '',
 fr: s.description?.fr || '',
 rw: s.description?.rw || '',
 },
 })),
 tags: Array.isArray(t.tags) ? t.tags.join(', ') : t.tags || '',
 estimatedMinutes: t.estimatedMinutes ?? 30,
 difficulty: t.difficulty || 'easy',
 isFeatured: t.isFeatured ?? false,
 isActive: t.isActive ?? true,
 });
 if (t.coverImage) {
 setCoverPreview(t.coverImage.startsWith('http') ? t.coverImage : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${t.coverImage}`);
 }
 } catch {
 toast.error('Failed to load trail');
 navigate('/admin/trails');
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

 // ---------- Stop helpers ----------
 const addStop = () => {
 setForm((prev) => ({
 ...prev,
 stops: [
 ...prev.stops,
 { order: prev.stops.length + 1, artifactId: '', description: emptyMultilang() },
 ],
 }));
 };

 const removeStop = (idx) => {
 setForm((prev) => ({
 ...prev,
 stops: prev.stops.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })),
 }));
 };

 const moveStop = (idx, direction) => {
 setForm((prev) => {
 const stops = [...prev.stops];
 const target = idx + direction;
 if (target < 0 || target >= stops.length) return prev;
 [stops[idx], stops[target]] = [stops[target], stops[idx]];
 return { ...prev, stops: stops.map((s, i) => ({ ...s, order: i + 1 })) };
 });
 };

 const updateStop = (idx, field, value) => {
 setForm((prev) => {
 const stops = [...prev.stops];
 stops[idx] = { ...stops[idx], [field]: value };
 return { ...prev, stops };
 });
 };

 const updateStopDesc = (idx, lang, value) => {
 setForm((prev) => {
 const stops = [...prev.stops];
 stops[idx] = {
 ...stops[idx],
 description: { ...stops[idx].description, [lang]: value },
 };
 return { ...prev, stops };
 });
 };

 // ---------- Submit ----------
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
 ['title', 'introduction', 'description'].forEach((field) => {
 LANGUAGES.forEach((lang) => {
 fd.append(`${field}[${lang}]`, form[field][lang]);
 });
 });

 // Cover image
 if (form.coverImage) fd.append('coverImage', form.coverImage);

 // Audio & Video
 if (form.audio) fd.append('audio', form.audio);
 if (form.video) fd.append('video', form.video);

 // Stops as JSON
 fd.append('stops', JSON.stringify(form.stops));

 // Tags as JSON array
 const tagsArray = form.tags
 .split(',')
 .map((t) => t.trim())
 .filter(Boolean);
 fd.append('tags', JSON.stringify(tagsArray));

 // Scalars
 fd.append('estimatedMinutes', form.estimatedMinutes);
 fd.append('difficulty', form.difficulty);
 fd.append('isFeatured', form.isFeatured);
 fd.append('isActive', form.isActive);

 if (isEditing) {
 await adminUpdateTrail(id, fd);
 toast.success('Trail updated');
 } else {
 await adminCreateTrail(fd);
 toast.success('Trail created');
 }
 navigate('/admin/trails');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save trail');
 } finally {
 setLoading(false);
 }
 };

 // ---------- Render helpers ----------
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
 : 'text-slate-300 hover:bg-slate-800'
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

 // Artifact name lookup
 const getArtifactLabel = useCallback(
 (artifactId) => {
 const art = artifacts.find((a) => a._id === artifactId);
 if (!art) return 'Select artifact...';
 const name = art.title?.en || art.title || art.name?.en || art.name || 'Unnamed';
 return name;
 },
 [artifacts]
 );

 const filteredArtifacts = artifacts.filter((a) => {
 if (!artifactSearch) return true;
 const term = artifactSearch.toLowerCase();
 const name = (a.title?.en || a.title || a.name?.en || a.name || '').toLowerCase();
 return name.includes(term);
 });

 if (fetching) {
 return <TextSkeleton lines={8} />;
 }

 return (
 <div>
 <button
 onClick={() => navigate('/admin/trails')}
 className="flex items-center gap-2 text-slate-400 hover:text-amber-600 mb-6 transition"
 >
 <ArrowLeft size={20} /> Back to Trails
 </button>

 <h1 className="admin-header-title mb-6">
 {isEditing ? 'Edit Trail' : 'Create Trail'}
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
 : 'text-slate-300 hover:bg-slate-800 bg-slate-900 border border-slate-700'
 }`}
 >
 {tab}
 </button>
 ))}
 </div>

 <form onSubmit={handleSubmit}>
 {/* TAB 0: Basic Info */}
 {activeTab === 0 && (
 <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6 space-y-6">
 <div>
 <label className="form-label">
 Title *
 </label>
 {renderMultiLangInput('title', titleLang, setTitleLang, 'input', 'Trail title')}
 </div>

 <div>
 <label className="form-label">
 Introduction
 </label>
 {renderMultiLangInput('introduction', introLang, setIntroLang, 'textarea', 'Introduction')}
 </div>

 <div>
 <label className="form-label">
 Description
 </label>
 {renderMultiLangInput('description', descLang, setDescLang, 'textarea', 'Description')}
 </div>

 {/* Cover Image */}
 <div>
 <label className="form-label mb-2">
 Cover Image
 </label>
 <div className="flex items-center gap-4">
 {coverPreview && (
 <img src={coverPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />
 )}
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500 cursor-pointer transition">
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
 </div>
 )}

 {/* TAB 1: Stops */}
 {activeTab === 1 && (
 <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-lg font-semibold text-white">
 Trail Stops ({form.stops.length})
 </h2>
 <button
 type="button"
 onClick={addStop}
 className="flex items-center gap-1 text-sm bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition font-medium"
 >
 <Plus size={16} /> Add Stop
 </button>
 </div>

 {form.stops.length === 0 && (
 <p className="text-slate-400 text-sm py-8 text-center">
 No stops yet. Click "Add Stop" to build this trail.
 </p>
 )}

 <div className="space-y-4">
 {form.stops.map((stop, idx) => (
 <StopCard
 key={idx}
 stop={stop}
 idx={idx}
 total={form.stops.length}
 artifacts={filteredArtifacts}
 artifactSearch={artifactSearch}
 setArtifactSearch={setArtifactSearch}
 getArtifactLabel={getArtifactLabel}
 onUpdateStop={updateStop}
 onUpdateStopDesc={updateStopDesc}
 onRemove={removeStop}
 onMove={moveStop}
 />
 ))}
 </div>
 </div>
 )}

 {/* TAB 2: Media */}
 {activeTab === 2 && (
 <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6 space-y-6">
 <div>
 <label className="form-label mb-2">
 Narration Audio
 </label>
 <p className="text-xs text-slate-400 mb-2">
 Upload an audio file to narrate this trail (MP3, WAV, OGG — max 25MB)
 </p>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
 <Upload size={18} />
 <span>{form.audio ? 'Change Audio' : 'Upload Audio'}</span>
 <input
 type="file"
 accept="audio/*"
 onChange={(e) => handleChange('audio', e.target.files[0] || null)}
 className="hidden"
 />
 </label>
 {form.audio && (
 <p className="text-sm text-slate-400 mt-2">{form.audio.name}</p>
 )}
 </div>

 <div>
 <label className="form-label mb-2">
 Video
 </label>
 <p className="text-xs text-slate-400 mb-2">
 Upload a video for this trail (MP4, WebM — max 50MB)
 </p>
 <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
 <Upload size={18} />
 <span>{form.video ? 'Change Video' : 'Upload Video'}</span>
 <input
 type="file"
 accept="video/*"
 onChange={(e) => handleChange('video', e.target.files[0] || null)}
 className="hidden"
 />
 </label>
 {form.video && (
 <p className="text-sm text-slate-400 mt-2">{form.video.name}</p>
 )}
 </div>
 </div>
 )}

 {/* TAB 3: Settings */}
 {activeTab === 3 && (
 <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6 space-y-6">
 <div className="grid md:grid-cols-3 gap-4">
 <div>
 <label className="form-label">
 Estimated Duration (minutes)
 </label>
 <input
 type="number"
 value={form.estimatedMinutes}
 onChange={(e) => handleChange('estimatedMinutes', parseInt(e.target.value) || 0)}
 className={inputClass}
 min={1}
 />
 </div>
 <div>
 <label className="form-label">
 Difficulty
 </label>
 <select
 value={form.difficulty}
 onChange={(e) => handleChange('difficulty', e.target.value)}
 className={inputClass}
 >
 <option value="easy">Easy</option>
 <option value="moderate">Moderate</option>
 <option value="detailed">Detailed</option>
 </select>
 </div>
 <div>
 <label className="form-label">
 Tags (comma-separated)
 </label>
 <input
 type="text"
 value={form.tags}
 onChange={(e) => handleChange('tags', e.target.value)}
 className={inputClass}
 placeholder="history, culture, art"
 />
 </div>
 </div>

 <div className="flex gap-6">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={form.isFeatured}
 onChange={(e) => handleChange('isFeatured', e.target.checked)}
 className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
 />
 <span className="text-sm text-slate-300">Featured</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={form.isActive}
 onChange={(e) => handleChange('isActive', e.target.checked)}
 className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
 />
 <span className="text-sm text-slate-300">Active</span>
 </label>
 </div>
 </div>
 )}

 {/* Submit */}
 <div className="flex justify-end mt-6">
 <button
 type="submit"
 disabled={loading}
 className="btn btn-primary btn-lg"
 >
 <Save size={18} />
 {loading ? 'Saving...' : isEditing ? 'Update Trail' : 'Create Trail'}
 </button>
 </div>
 </form>
 </div>
 );
};

// ---------- Stop Card sub-component ----------
const StopCard = ({
 stop,
 idx,
 total,
 artifacts,
 artifactSearch,
 setArtifactSearch,
 getArtifactLabel,
 onUpdateStop,
 onUpdateStopDesc,
 onRemove,
 onMove,
}) => {
 const [descLang, setDescLang] = useState('en');
 const [dropdownOpen, setDropdownOpen] = useState(false);

 return (
 <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/50">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <GripVertical size={16} className="text-slate-400" />
 <span className="text-sm font-semibold text-slate-300">
 Stop #{stop.order}
 </span>
 </div>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => onMove(idx, -1)}
 disabled={idx === 0}
 className="p-1 text-slate-400 hover:text-slate-400 disabled:opacity-30 transition"
 title="Move up"
 >
 <ChevronUp size={16} />
 </button>
 <button
 type="button"
 onClick={() => onMove(idx, 1)}
 disabled={idx === total - 1}
 className="p-1 text-slate-400 hover:text-slate-400 disabled:opacity-30 transition"
 title="Move down"
 >
 <ChevronDown size={16} />
 </button>
 <button
 type="button"
 onClick={() => onRemove(idx)}
 className="p-1 text-red-500 hover:bg-red-900/20 rounded-lg transition ml-1"
 title="Remove stop"
 >
 <X size={16} />
 </button>
 </div>
 </div>

 {/* Artifact selector */}
 <div className="mb-3 relative">
 <label className="form-label">
 Artifact *
 </label>
 <button
 type="button"
 onClick={() => setDropdownOpen(!dropdownOpen)}
 className={`${inputClass} text-left flex items-center justify-between`}
 >
 <span className={stop.artifactId ? '' : 'text-slate-400'}>
 {stop.artifactId ? getArtifactLabel(stop.artifactId) : 'Select artifact...'}
 </span>
 <Search size={14} className="text-slate-400" />
 </button>

 {dropdownOpen && (
 <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
 <div className="sticky top-0 bg-slate-800 p-2 border-b border-slate-700">
 <input
 type="text"
 value={artifactSearch}
 onChange={(e) => setArtifactSearch(e.target.value)}
 placeholder="Search artifacts..."
 className="form-input"
 autoFocus
 />
 </div>
 {artifacts.length === 0 && (
 <p className="px-3 py-2 text-sm text-slate-400">No artifacts found</p>
 )}
 {artifacts.map((art) => (
 <button
 key={art._id}
 type="button"
 onClick={() => {
 onUpdateStop(idx, 'artifactId', art._id);
 setDropdownOpen(false);
 setArtifactSearch('');
 }}
 className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-900/20 transition ${
 stop.artifactId === art._id
 ? 'bg-amber-900/20 text-amber-400 font-medium'
 : 'text-slate-300'
 }`}
 >
 {art.title?.en || art.title || art.name?.en || art.name || 'Unnamed'}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Stop description (multilingual) */}
 <div>
 <label className="form-label">
 Stop Description
 </label>
 <div className="flex gap-1 mb-1">
 {LANGUAGES.map((lang) => (
 <button
 key={lang}
 type="button"
 onClick={() => setDescLang(lang)}
 className={`px-2 py-1 text-xs rounded-md font-medium transition ${
 descLang === lang
 ? 'bg-amber-600 text-white'
 : 'text-slate-400 hover:bg-slate-800'
 }`}
 >
 {LANG_LABELS[lang]}
 </button>
 ))}
 </div>
 {LANGUAGES.map((lang) => (
 <textarea
 key={lang}
 value={stop.description[lang]}
 onChange={(e) => onUpdateStopDesc(idx, lang, e.target.value)}
 className={`form-input ${
 descLang !== lang ? 'hidden' : ''
 }`}
 placeholder={`Description (${LANG_LABELS[lang]})`}
 rows={2}
 />
 ))}
 </div>
 </div>
 );
};

export default TrailForm;
