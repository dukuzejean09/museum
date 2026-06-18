import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchArtifacts } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardGridSkeleton } from '../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import { useRealtimeSync } from '../hooks/useRealtimeStore';

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

const Artifacts = () => {
 const { t, lang } = useLanguage();
 const [search, setSearch] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [page, setPage] = useState(1);
 const limit = 12;

 useRealtimeSync('artifact', ['artifacts']);

 useEffect(() => {
 const timer = setTimeout(() => setDebouncedSearch(search), 400);
 return () => clearTimeout(timer);
 }, [search]);

 useEffect(() => { setPage(1); }, [debouncedSearch]);

 const { data: queryData, isLoading: loading } = useQuery({
   queryKey: ['artifacts', { page, search: debouncedSearch }],
   queryFn: async () => {
     const params = { page, limit, status: 'published' };
     if (debouncedSearch) params.q = debouncedSearch;
     const { data } = await fetchArtifacts(params);
     if (Array.isArray(data)) return { artifacts: data, totalPages: 1 };
     return { artifacts: data.data || [], totalPages: data.pagination?.pages || 1 };
   },
   staleTime: 5 * 60 * 1000,
   placeholderData: keepPreviousData,
 });

 const artifacts = queryData?.artifacts || [];
 const totalPages = queryData?.totalPages || 1;

 return (
 <div className="page-container">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
 <div className="flex items-center gap-3">
 <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
 <Sparkles size={24} className="text-amber-600" />
 </div>
 <div>
 <h1 className="text-2xl font-bold dark:text-white">{t('artifact.title')}</h1>
 <p className="text-slate-500 dark:text-slate-400 text-sm">{t('artifact.subtitle')}</p>
 </div>
 </div>
 <div className="relative w-full sm:w-72">
 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 placeholder={t('common.search') + '...'}
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="form-input pl-10"
 />
 </div>
 </div>

 {/* Grid */}
 {loading ? (
 <CardGridSkeleton />
 ) : artifacts.length > 0 ? (
 <>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
 {artifacts.map((artifact) => (
 <Link
 key={artifact._id}
 to={`/artifacts/${artifact._id}`}
 className="card-flush group hover:shadow-lg transition-all duration-300"
 >
 <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
 {artifact.image ? (
 <img
 src={imageUrl(artifact.image)}
 alt={getLocalizedText(artifact.name, lang)}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
 <Sparkles size={40} />
 </div>
 )}
 {artifact.category && (
 <span className="absolute top-3 left-3 bg-amber-600 text-white px-2 py-0.5 rounded text-xs font-semibold uppercase">
 {artifact.category}
 </span>
 )}
 </div>
 <div className="p-4">
 <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
 {getLocalizedText(artifact.name, lang)}
 </h3>
 <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
 {getLocalizedText(artifact.description, lang)}
 </p>
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
