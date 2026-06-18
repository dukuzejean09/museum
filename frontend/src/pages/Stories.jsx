import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchStories } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArtifactSlideshowCard } from '../components/ArtifactSlideshow';
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

const Stories = () => {
 const { t, lang } = useLanguage();
 const [search, setSearch] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [page, setPage] = useState(1);
 const limit = 9;

 useRealtimeSync('story', ['stories']);

 useEffect(() => {
 const timer = setTimeout(() => setDebouncedSearch(search), 400);
 return () => clearTimeout(timer);
 }, [search]);

 useEffect(() => {
 setPage(1);
 }, [debouncedSearch]);

 const { data: queryData, isLoading: loading } = useQuery({
   queryKey: ['stories', { page, search: debouncedSearch }],
   queryFn: async () => {
     const params = { page, limit, status: 'published' };
     if (debouncedSearch) params.q = debouncedSearch;
     const { data } = await fetchStories(params);
     if (Array.isArray(data)) return { stories: data, totalPages: 1 };
     const list = data.data || data.stories || data.docs || [];
     const pages = data.pagination?.pages || data.totalPages || Math.ceil((data.pagination?.total || data.total || 0) / limit) || 1;
     return { stories: list, totalPages: pages };
   },
   staleTime: 5 * 60 * 1000,
   placeholderData: keepPreviousData,
 });

 const stories = queryData?.stories || [];
 const totalPages = queryData?.totalPages || 1;

 return (
 <div className="page-container">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
 <div className="flex items-center gap-3">
 <div className="flex-shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
 <BookOpen size={24} className="text-amber-600" />
 </div>
 <div>
 <h1 className="text-2xl font-bold dark:text-white">{t('story.title')}</h1>
 <p className="text-slate-500 dark:text-slate-400 text-sm">{t('story.subtitle')}</p>
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

 {/* Story Grid */}
 {loading ? (
 <CardGridSkeleton />
 ) : stories.length > 0 ? (
 <>
 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {stories.map((story) => (
 <Link
 key={story._id}
 to={`/stories/${story._id}`}
 className="card-flush group hover:shadow-lg transition-all duration-300"
 >
 <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
 {story.exhibitionId?.artifacts?.length > 0 ? (
   <ArtifactSlideshowCard
     artifacts={story.exhibitionId.artifacts}
     className="w-full h-full group-hover:scale-105 transition-transform duration-500"
     interval={3500 + Math.random() * 1500}
   />
 ) : story.exhibitionId?.coverImage ? (
   <img
     src={imageUrl(story.exhibitionId.coverImage)}
     alt={getLocalizedText(story.title, lang)}
     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
   />
 ) : (
   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-800">
     <BookOpen size={40} className="text-white/50" />
   </div>
 )}
 </div>
 <div className="p-5">
 <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
 {getLocalizedText(story.title, lang)}
 </h3>
 <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
 {getLocalizedText(story.content, lang)}
 </p>
 {story.exhibitionId && (
 <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium truncate">
 {getLocalizedText(story.exhibitionId.title, lang) || t('story.linkedExhibition') || 'View Exhibition'}
 </p>
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
 <BookOpen size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
 <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{t('search.noResults') || 'No results found'}</p>
 <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('common.noData') || 'No data available'}</p>
 </div>
 )}
 </div>
 );
};

export default Stories;
