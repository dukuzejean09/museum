import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchExhibitions } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArtifactSlideshowCard } from '../components/ArtifactSlideshow';
import toast from 'react-hot-toast';
import { CardGridSkeleton } from '../components/ui/LoadingSkeleton';
import { useRealtimeSync } from '../hooks/useRealtimeStore';

const imageUrl = (path) => {
 if (!path) return null;
 if (path.startsWith('http')) return path;
 const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
 return `${base}${path}`;
};

const Exhibitions = () => {
 const { t, lang, getLocalized } = useLanguage();
 const { isAdmin } = useAuth();
 const [search, setSearch] = useState('');
 const [debouncedSearch, setDebouncedSearch] = useState('');
 const [page, setPage] = useState(1);
 const limit = 9;

 // Real-time sync
 useRealtimeSync('exhibition', ['exhibitions']);

 // Debounce search
 useEffect(() => {
 const timer = setTimeout(() => setDebouncedSearch(search), 400);
 return () => clearTimeout(timer);
 }, [search]);

 useEffect(() => {
 setPage(1);
 }, [debouncedSearch]);

 const { data: queryData, isLoading: loading } = useQuery({
   queryKey: ['exhibitions', { page, search: debouncedSearch }],
   queryFn: async () => {
     const params = { page, limit, status: 'published' };
     if (debouncedSearch) params.q = debouncedSearch;
     const { data } = await fetchExhibitions(params);
     if (Array.isArray(data)) {
       return { exhibitions: data, totalPages: 1 };
     }
     const list = data.data || data.exhibitions || data.docs || [];
     const pages = data.pagination?.pages || data.totalPages || Math.ceil((data.pagination?.total || data.total || 0) / limit) || 1;
     return { exhibitions: list, totalPages: pages };
   },
   staleTime: 5 * 60 * 1000,
   placeholderData: keepPreviousData,
 });

 const exhibitions = queryData?.exhibitions || [];
 const totalPages = queryData?.totalPages || 1;

 return (
 <div className="page-container">
 <div className="page-header">
 <div className="page-header-left">
 <div className="page-header-icon">
 <Sparkles size={24} />
 </div>
 <div>
 <h1 className="page-title">{t('exhibition.title')}</h1>
 <p className="page-subtitle">{t('exhibition.subtitle')}</p>
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

 {/* Exhibition Grid */}
 {loading ? (
 <CardGridSkeleton count={6} />
 ) : exhibitions.length > 0 ? (
 <>
 <div className="grid-cards">
 {exhibitions.map((ex) => (
 <Link
 key={ex._id}
 to={`/exhibitions/${ex._id}`}
 className="card-flush group hover:shadow-lg transition-all duration-300"
 >
 <div className="card-image">
 {ex.artifacts?.length > 0 ? (
 <ArtifactSlideshowCard
 artifacts={ex.artifacts}
 className="w-full h-full group-hover:scale-105 transition-transform duration-500"
 interval={3500 + Math.random() * 1500}
 />
 ) : ex.coverImage ? (
 <img
 src={imageUrl(ex.coverImage)}
 alt={getLocalized(ex.title)}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400">
 <Sparkles size={48} />
 </div>
 )}
 {ex.artifacts?.length > 0 && (
 <span className="badge badge-primary" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
 {ex.artifacts.length} {t('exhibition.artifacts')}
 </span>
 )}
 {ex.status && ex.status !== 'published' && isAdmin && (
 <span className={`badge ${
 ex.status === 'draft' ? 'status-draft' :
 ex.status === 'archived' ? 'status-archived' :
 'status-published'
 }`} style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
 {t(`common.${ex.status}`) || ex.status}
 </span>
 )}
 </div>
 <div className="card-body">
 <h3 className="card-title">
 {getLocalized(ex.title)}
 </h3>
 <p className="card-desc">
 {getLocalized(ex.shortDescription || ex.description)}
 </p>
 {ex.tags?.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-1.5">
 {ex.tags.slice(0, 3).map((tag, i) => (
 <span key={i} className="tag">{tag}</span>
 ))}
 </div>
 )}
 </div>
 </Link>
 ))}
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="pagination">
 <button
 onClick={() => setPage(p => Math.max(1, p - 1))}
 disabled={page === 1}
 className="pagination-btn"
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
 className={`pagination-num ${p === page ? 'active' : ''}`}
 >
 {p}
 </button>
 </span>
 ))}
 <button
 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 className="pagination-btn"
 >
 <ChevronRight size={18} />
 </button>
 </div>
 )}
 </>
 ) : (
 <div className="empty-state">
 <Sparkles size={48} className="empty-state-icon" />
 <p className="empty-state-title">{t('search.noResults')}</p>
 <p className="empty-state-desc">{t('common.noData')}</p>
 </div>
 )}
 </div>
 );
};

export default Exhibitions;
