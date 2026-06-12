import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchStories } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardGridSkeleton } from '../components/ui/LoadingSkeleton';
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

const Stories = () => {
 const { t, lang } = useLanguage();
 const [stories, setStories] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const limit = 9;

 useEffect(() => {
 const timer = setTimeout(() => setDebouncedSearch(search), 400);
 return () => clearTimeout(timer);
 }, [search]);

 useEffect(() => {
 setPage(1);
 }, [debouncedSearch]);

 const loadStories = useCallback(async () => {
 setLoading(true);
 try {
 const params = { page, limit, status: 'published' };
 if (debouncedSearch) params.q = debouncedSearch;
 const { data } = await fetchStories(params);
 if (Array.isArray(data)) {
 setStories(data);
 setTotalPages(1);
 } else {
 setStories(data.data || data.stories || data.docs || []);
 setTotalPages(data.pagination?.pages || data.totalPages || Math.ceil((data.pagination?.total || data.total || 0) / limit) || 1);
 }
 } catch {
 toast.error('Failed to load stories');
 setStories([]);
 } finally {
 setLoading(false);
 }
 }, [page, debouncedSearch]);

 useEffect(() => { loadStories(); }, [loadStories]);

 return (
 <div className="container mx-auto px-4 py-8">
 <div className="mb-8">
 <h1 className="text-3xl font-bold">{t('story.title') || 'Stories'}</h1>
 <p className="text-slate-600 mt-1">{t('story.subtitle') || 'Narratives and tales from the museum collection'}</p>
 </div>

 {/* Search */}
 <div className="mb-8">
 <div className="relative max-w-md">
 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="text"
 placeholder={t('common.search') + '...'}
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
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
 className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 group"
 >
 <div className="relative h-48 overflow-hidden bg-slate-100">
 <div className="w-full h-full flex items-center justify-center text-slate-400">
 <BookOpen size={48} />
 </div>
 </div>
 <div className="p-5">
 <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
 {getLocalizedText(story.title, lang)}
 </h3>
 <p className="mt-2 text-sm text-slate-600 line-clamp-3">
 {getLocalizedText(story.content, lang)}
 </p>
 {story.exhibitionId && (
 <p className="mt-3 text-xs text-amber-600 font-medium truncate">
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
 className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
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
 : 'border border-slate-200 hover:bg-slate-100 text-slate-700'
 }`}
 >
 {p}
 </button>
 </span>
 ))}
 <button
 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
 >
 <ChevronRight size={18} />
 </button>
 </div>
 )}
 </>
 ) : (
 <div className="text-center py-20">
 <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
 <p className="text-lg font-medium text-slate-500">{t('search.noResults') || 'No results found'}</p>
 <p className="text-sm text-slate-400 mt-1">{t('common.noData') || 'No data available'}</p>
 </div>
 )}
 </div>
 );
};

export default Stories;
