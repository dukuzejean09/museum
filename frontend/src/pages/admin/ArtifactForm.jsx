import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminFetchArtifact,
  adminCreateArtifact,
  adminUpdateArtifact,
} from '../../api';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = ['en', 'fr', 'rw'];
const LANG_LABELS = { en: 'English', fr: 'French', rw: 'Kinyarwanda' };

const ARTIFACT_TYPES = [
  { value: 'object', label: 'Object' },
  { value: 'image', label: 'Image' },
  { value: 'document', label: 'Document' },
  { value: 'location', label: 'Location' },
  { value: 'specimen', label: 'Specimen' },
];

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none';

const ArtifactForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  // Language tab states for each multilingual group
  const [titleLang, setTitleLang] = useState('en');
  const [descLang, setDescLang] = useState('en');
  const [detailsLang, setDetailsLang] = useState('en');
  const [originLang, setOriginLang] = useState('en');

  // Cover preview
  const [coverPreview, setCoverPreview] = useState(null);

  const [form, setForm] = useState({
    title: { en: '', fr: '', rw: '' },
    description: { en: '', fr: '', rw: '' },
    historicalDetails: { en: '', fr: '', rw: '' },
    origin: { en: '', fr: '', rw: '' },
    type: 'object',
    year: '',
    tags: '',
    coverImage: null,
    images: null,
    status: 'draft',
  });

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const { data } = await adminFetchArtifact(id);
        const a = data.artifact || data;
        setForm({
          title: { en: a.title?.en || '', fr: a.title?.fr || '', rw: a.title?.rw || '' },
          description: { en: a.description?.en || '', fr: a.description?.fr || '', rw: a.description?.rw || '' },
          historicalDetails: { en: a.historicalDetails?.en || '', fr: a.historicalDetails?.fr || '', rw: a.historicalDetails?.rw || '' },
          origin: { en: a.origin?.en || '', fr: a.origin?.fr || '', rw: a.origin?.rw || '' },
          type: a.type || 'object',
          year: a.year || '',
          tags: Array.isArray(a.tags) ? a.tags.join(', ') : a.tags || '',
          coverImage: null,
          images: null,
          status: a.status || 'draft',
        });
        if (a.coverImage) {
          const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
          setCoverPreview(`${base}${a.coverImage}`);
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
    if (!form.title.en.trim()) {
      toast.error('Title (English) is required');
      return;
    }
    setLoading(true);

    try {
      const fd = new FormData();

      // Multilingual fields
      ['title', 'description', 'historicalDetails', 'origin'].forEach((field) => {
        LANGUAGES.forEach((lang) => {
          fd.append(`${field}[${lang}]`, form[field][lang]);
        });
      });

      // Simple fields
      fd.append('type', form.type);
      fd.append('year', form.year);
      fd.append('status', form.status);

      // Files
      if (form.coverImage) fd.append('coverImage', form.coverImage);
      if (form.images) {
        Array.from(form.images).forEach((f) => fd.append('images', f));
      }

      // Tags
      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      tagsArray.forEach((tag) => fd.append('tags[]', tag));

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
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
        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            {renderMultiLangInput('title', titleLang, setTitleLang, 'input', 'Artifact title')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            {renderMultiLangInput('description', descLang, setDescLang, 'textarea', 'Description')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Historical Details</label>
            {renderMultiLangInput('historicalDetails', detailsLang, setDetailsLang, 'textarea', 'Historical details')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origin</label>
            {renderMultiLangInput('origin', originLang, setOriginLang, 'input', 'Origin')}
          </div>
        </div>

        {/* Type, Year, Tags, Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className={inputClass}
              >
                {ARTIFACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <input
                type="text"
                value={form.year}
                onChange={(e) => handleChange('year', e.target.value)}
                className={inputClass}
                placeholder="e.g. 1920"
              />
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
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className={inputClass}
              placeholder="art, history, culture"
            />
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6 mt-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cover Image</label>
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

          {/* Additional Images */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Additional Images</label>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500 cursor-pointer transition w-fit">
              <Upload size={18} />
              <span>Upload Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleChange('images', e.target.files)}
                className="hidden"
              />
            </label>
            {form.images && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {form.images.length} file(s) selected
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
