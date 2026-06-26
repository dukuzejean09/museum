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

const Stories = () => {
 const { t, lang, getLocalized } = useLanguage();
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
 <div className="page-header">
 <div className="page-header-left">
 <div className="page-header-icon">
 <BookOpen size={24} />
 </div>
 <div>
 <h1 className="page-title">{t('story.title')}</h1>
 <p className="page-subtitle">{t('story.subtitle')}</p>
 </div>
 </div>
 <div className="search-wrap">
 <Search size={18} className="search-icon" />
 <input
 type="text"
 placeholder={t('common.search') + '...'}
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="form-input"
 />
 </div>
 </div>

 {/* Story Grid */}
 {loading ? (
 <CardGridSkeleton />
 ) : stories.length > 0 ? (
 <>
 <div className="grid-cards">
 {stories.map((story) => (
 <Link
 key={story._id}
 to={`/stories/${story._id}`}
 className="card-flush group hover:shadow-lg transition-all duration-300"
 >
 <div className="card-image">
 {story.exhibitionId?.artifacts?.length > 0 ? (
   <ArtifactSlideshowCard
     artifacts={story.exhibitionId.artifacts}
     className="w-full h-full group-hover:scale-105 transition-transform duration-500"
     interval={3500 + Math.random() * 1500}
   />
 ) : story.exhibitionId?.coverImage ? (
   <img
     src={imageUrl(story.exhibitionId.coverImage)}
     alt={getLocalized(story.title)}
     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
   />
 ) : (
   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 to-amber-800">
     <BookOpen size={40} className="text-white/50" />
   </div>
 )}
 </div>
 <div className="card-body">
 <h3 className="card-title">
 {getLocalized(story.title)}
 </h3>
 <p className="card-desc" style={{ WebkitLineClamp: 3 }}>
 {getLocalized(story.content)}
 </p>
 {story.exhibitionId && (
 <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium truncate">
 {getLocalized(story.exhibitionId.title) || t('story.linkedExhibition') || 'View Exhibition'}
 </p>
 )}
 </div>
 </Link>
 ))}
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="pagination">
 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pagination-btn">
 <ChevronLeft size={18} />
 </button>
 {Array.from({ length: totalPages }, (_, i) => i + 1)
 .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
 .map((p, i, arr) => (
 <span key={p}>
 {i > 0 && arr[i - 1] < p - 1 && <span className="px-1 text-slate-400">...</span>}
 <button onClick={() => setPage(p)} className={`pagination-num ${p === page ? 'active' : ''}`}>
 {p}
 </button>
 </span>
 ))}
 <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="pagination-btn">
 <ChevronRight size={18} />
 </button>
 </div>
 )}
 </>
 ) : (
 <div className="empty-state">
 <BookOpen size={48} className="empty-state-icon" />
 <p className="empty-state-title">{t('search.noResults') || 'No results found'}</p>
 <p className="empty-state-desc">{t('common.noData') || 'No data available'}</p>
 </div>
 )}
 </div>
 );
};

export default Stories;
