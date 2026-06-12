import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminFetchStory,
  adminCreateStory,
  adminUpdateStory,
  adminFetchExhibitions,
} from '../../api';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = ['en', 'fr', 'rw'];
const LANG_LABELS = { en: 'English', fr: 'French', rw: 'Kinyarwanda' };

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none';

const StoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [titleLang, setTitleLang] = useState('en');
  const [contentLang, setContentLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const [exhibitions, setExhibitions] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);

  const [form, setForm] = useState({
    title: { en: '', fr: '', rw: '' },
    content: { en: '', fr: '', rw: '' },
    coverImage: null,
    narrationAudio: null,
    exhibition: '',
    status: 'draft',
  });

  // Load exhibitions and exhibits for selectors
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { data } = await adminFetchExhibitions();
        setExhibitions(Array.isArray(data) ? data : data.exhibitions || data.docs || []);
      } catch {
        // silent
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const { data } = await adminFetchStory(id);
        const s = data.story || data;
        setForm({
          title: { en: s.title?.en || '', fr: s.title?.fr || '', rw: s.title?.rw || '' },
          content: { en: s.content?.en || '', fr: s.content?.fr || '', rw: s.content?.rw || '' },
          coverImage: null,
          narrationAudio: null,
          exhibition: s.exhibition?._id || s.exhibition || '',
          status: s.status || 'draft',
        });
        if (s.coverImage) {
          const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
          setCoverPreview(`${base}${s.coverImage}`);
        }
      } catch (err) {
        toast.error('Failed to load story');
        navigate('/admin/stories');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange('coverImage', file);
      setCoverPreview(URL.createObjectURL(file));
    }
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
      LANGUAGES.forEach((lang) => {
        fd.append(`title[${lang}]`, form.title[lang]);
        fd.append(`content[${lang}]`, form.content[lang]);
      });
      if (form.coverImage) fd.append('coverImage', form.coverImage);
      if (form.narrationAudio) fd.append('narrationAudio', form.narrationAudio);
      if (form.exhibition) fd.append('exhibitionId', form.exhibition);
      fd.append('status', form.status);

      if (isEditing) {
        await adminUpdateStory(id, fd);
        toast.success('Story updated');
      } else {
        await adminCreateStory(fd);
        toast.success('Story created');
      }
      navigate('/admin/stories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save story');
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/stories')}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 mb-6 transition"
      >
        <ArrowLeft size={20} /> Back to Stories
      </button>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        {isEditing ? 'Edit Story' : 'Create Story'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Title</h2>
          {renderLangTabs(titleLang, setTitleLang)}
          {LANGUAGES.map((lang) => (
            <input
              key={lang}
              type="text"
              value={form.title[lang]}
              onChange={(e) => handleMultiLang('title', lang, e.target.value)}
              className={`${inputClass} ${titleLang !== lang ? 'hidden' : ''}`}
              placeholder={`Story title (${LANG_LABELS[lang]})`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Content</h2>
          {renderLangTabs(contentLang, setContentLang)}
          {LANGUAGES.map((lang) => (
            <textarea
              key={lang}
              value={form.content[lang]}
              onChange={(e) => handleMultiLang('content', lang, e.target.value)}
              className={`${inputClass} min-h-[200px] ${contentLang !== lang ? 'hidden' : ''}`}
              placeholder={`Story content (${LANG_LABELS[lang]})`}
              rows={10}
            />
          ))}
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Media</h2>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cover Image</label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <img src={coverPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />
              )}
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition">
                <Upload size={18} />
                <span>{coverPreview ? 'Change Image' : 'Upload Image'}</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Narration Audio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Narration Audio</label>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
              <Upload size={18} />
              <span>Upload Audio</span>
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
        </div>

        {/* Linking & Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Settings</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exhibition</label>
              <select
                value={form.exhibition}
                onChange={(e) => handleChange('exhibition', e.target.value)}
                className={inputClass}
              >
                <option value="">-- None --</option>
                {exhibitions.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.title?.en || ex.title || ex.name}
                  </option>
                ))}
              </select>
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
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl transition font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Saving...' : isEditing ? 'Update Story' : 'Create Story'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoryForm;
