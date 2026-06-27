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

const Artifacts = () => {
 const { t, lang, getLocalized } = useLanguage();
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
 <div className="page-header">
 <div className="page-header-left">
 <div className="page-header-icon">
 <Sparkles size={24} />
 </div>
 <div>
 <h1 className="page-title">{t('artifact.title')}</h1>
 <p className="page-subtitle">{t('artifact.subtitle')}</p>
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

 {/* Grid */}
 {loading ? (
 <CardGridSkeleton />
 ) : artifacts.length > 0 ? (
 <>
 <div className="grid-cards-4">
 {artifacts.map((artifact) => (
 <Link
 key={artifact._id}
 to={`/artifacts/${artifact._id}`}
 className="card-flush group hover:shadow-lg transition-all duration-300"
 >
 <div className="card-image">
 {artifact.image ? (
 <img
 src={imageUrl(artifact.image)}
 alt={getLocalized(artifact.name)}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400">
 <Sparkles size={40} />
 </div>
 )}
 {artifact.category && (
 <span className="badge badge-primary" style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', textTransform: 'uppercase' }}>
 {artifact.category}
 </span>
 )}
 </div>
 <div className="card-body">
 <h3 className="card-title">
 {getLocalized(artifact.name)}
 </h3>
 <p className="card-desc">
 {getLocalized(artifact.description)}
 </p>
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
 <Sparkles size={48} className="empty-state-icon" />
 <p className="empty-state-title">{t('search.noResults') || 'No results found'}</p>
 </div>
 )}
 </div>
 );
};

export default Artifacts;
