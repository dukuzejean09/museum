import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchArtifacts } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const imageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${base}${path}`;
};

const getLocalizedText = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

const typeLabels = {
  object: 'Object',
  image: 'Image',
  document: 'Document',
  location: 'Location',
  specimen: 'Specimen',
};

const Artifacts = () => {
  const { t, lang } = useLanguage();
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  const loadArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, status: 'published' };
      if (debouncedSearch) params.q = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      const { data } = await fetchArtifacts(params);
      if (Array.isArray(data)) {
        setArtifacts(data);
        setTotalPages(1);
      } else {
        setArtifacts(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch {
      toast.error('Failed to load artifacts');
      setArtifacts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => { loadArtifacts(); }, [loadArtifacts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white">{t('artifact.title') || 'Artifacts'}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{t('artifact.subtitle') || 'Individual historical objects, specimens, and documents'}</p>
      </div>

      {/* Search + Filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${!typeFilter ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
          >
            All
          </button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${typeFilter === key ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </div>
      ) : artifacts.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artifacts.map((artifact) => (
              <Link
                key={artifact._id}
                to={`/artifacts/${artifact._id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {artifact.coverImage ? (
                    <img
                      src={imageUrl(artifact.coverImage)}
                      alt={getLocalizedText(artifact.title, lang)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <Sparkles size={40} />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-amber-600 text-white px-2 py-0.5 rounded text-xs font-semibold uppercase">
                    {artifact.type}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {getLocalizedText(artifact.title, lang)}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {getLocalizedText(artifact.description, lang)}
                  </p>
                  {artifact.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {artifact.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] < p - 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        p === page
                          ? 'bg-amber-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Sparkles size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{t('search.noResults') || 'No results found'}</p>
        </div>
      )}
    </div>
  );
};

export default Artifacts;
