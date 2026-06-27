import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchArtifactById } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { DetailPageSkeleton } from '../components/ui/LoadingSkeleton';
import NarrationPlayer from '../components/ui/NarrationPlayer';
import toast from 'react-hot-toast';
import { useRealtimeEntity } from '../hooks/useRealtimeStore';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};
const mediaUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};

const ArtifactDetail = () => {
 const { t, lang, getLocalized } = useLanguage();
 const { id } = useParams();
 const [lightboxOpen, setLightboxOpen] = useState(false);
 const [lightboxIndex, setLightboxIndex] = useState(0);

 useRealtimeEntity('artifact', id, ['artifact', id]);

 const { data: artifact, isLoading: loading } = useQuery({
   queryKey: ['artifact', id],
   queryFn: () => fetchArtifactById(id).then(r => r.data),
   staleTime: 5 * 60 * 1000,
   enabled: !!id,
 });

 if (loading) {
 return (
 <DetailPageSkeleton />
 );
 }

 if (!artifact) {
 return (
 <div className="container mx-auto p-6 text-center">
 <h1 className="text-2xl font-bold mb-4">{t('common.noData')}</h1>
 <Link to="/artifacts" className="text-amber-600 hover:underline">{t('common.back')}</Link>
 </div>
 );
 }

 const allImages = [
 ...(artifact.image ? [artifact.image] : []),
 ...(artifact.additionalImages || []),
 ];

 return (
 <div>
 {/* Hero */}
 <div className="detail-hero">
 {allImages[0] ? (
 <img src={imgUrl(allImages[0])} alt={getLocalized(artifact.name)} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400">
 <Sparkles size={60} />
 </div>
 )}
 <div className="detail-hero-overlay" />
 <div className="detail-hero-content">
 <div className="container mx-auto">
 <Link to="/artifacts" className="back-link">
 <ArrowLeft size={16} /> {t('common.back')}
 </Link>
 <div className="flex items-center gap-3 mb-2">
 {artifact.category && (
 <span className="badge badge-primary" style={{ textTransform: 'uppercase' }}>{artifact.category}</span>
 )}
 {artifact.dateCreated && (
 <span className="flex items-center gap-1 text-white/70 text-sm"><Calendar size={14} /> {artifact.dateCreated}</span>
 )}
 </div>
 <h1>
 {getLocalized(artifact.name)}
 </h1>
 </div>
 </div>
 </div>

 <div className="page-container">
 <div className="detail-layout">
 {/* Main */}
 <div className="space-y-8">
 {/* Description */}
 {getLocalized(artifact.description) && (
 <div>
 <h2 className="detail-section-title">{t('exhibits.description') || 'Description'}</h2>
 <p className="detail-text whitespace-pre-line">
 {getLocalized(artifact.description)}
 </p>
 </div>
 )}

 {/* Historical Story */}
 {getLocalized(artifact.historicalStory) && (
 <div>
 <h2 className="detail-section-title">{t('exhibits.historicalContext') || 'Historical Story'}</h2>
 <p className="detail-text whitespace-pre-line">
 {getLocalized(artifact.historicalStory)}
 </p>
 </div>
 )}

 {/* Details */}
 <div className="space-y-3">
 {artifact.dateDiscovered && (
 <div className="flex items-start gap-2">
 <Calendar size={18} className="text-amber-600 mt-1 flex-shrink-0" />
 <div>
 <h3 className="font-semibold">Date Discovered / Collected</h3>
 <p className="text-slate-400">{artifact.dateDiscovered}</p>
 </div>
 </div>
 )}

 {getLocalized(artifact.originLocation) && (
 <div className="flex items-start gap-2">
 <MapPin size={18} className="text-amber-600 mt-1 flex-shrink-0" />
 <div>
 <h3 className="font-semibold">Origin / Location</h3>
 <p className="text-slate-400">{getLocalized(artifact.originLocation)}</p>
 </div>
 </div>
 )}
 </div>

 {/* Image Gallery */}
 {allImages.length > 1 && (
 <div>
 <h2 className="detail-section-title">{t('exhibition.gallery') || 'Gallery'}</h2>
 <div className="gallery-grid">
 {allImages.map((img, i) => (
 <div
 key={i}
 className="gallery-item"
 onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
 >
 <img src={imgUrl(img)} alt={`Image ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Audio Narration */}
 <NarrationPlayer
 audioSrc={mediaUrl(artifact.narrationAudioUrl)}
 text={[getLocalized(artifact.name), getLocalized(artifact.description), getLocalized(artifact.historicalStory)].filter(Boolean).join('. ')}
 title={t('exhibits.audioNarration') || 'Audio Narration'}
 lang={lang}
 />

 {/* Related Exhibitions */}
 {artifact.exhibitions?.length > 0 && (
 <div className="sidebar-card">
 <h3 className="sidebar-card-title">{t('artifact.inExhibitions') || 'Found in Exhibitions'}</h3>
 <div className="space-y-3">
 {artifact.exhibitions.map(ex => (
 <Link
 key={ex._id}
 to={`/exhibitions/${ex._id}`}
 className="sidebar-link"
 >
 <div className="sidebar-thumb">
 {ex.coverImage ? (
 <img src={imgUrl(ex.coverImage)} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={16} /></div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium group-hover:text-amber-600 transition-colors truncate">
 {getLocalized(ex.title)}
 </p>
 </div>
 <ExternalLink size={14} className="text-slate-400 flex-shrink-0" />
 </Link>
 ))}
 </div>
 </div>
 )}

 {/* Related Trails */}
 {artifact.trails?.length > 0 && (
 <div className="sidebar-card">
 <h3 className="sidebar-card-title">{t('artifact.inTrails') || 'Featured in Trails'}</h3>
 <div className="space-y-3">
 {artifact.trails.map(trail => (
 <Link
 key={trail._id}
 to={`/trails/${trail._id}`}
 className="sidebar-link"
 >
 <div className="sidebar-thumb">
 {trail.coverImage ? (
 <img src={imgUrl(trail.coverImage)} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={16} /></div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium group-hover:text-amber-600 transition-colors truncate">
 {getLocalized(trail.title)}
 </p>
 </div>
 <ExternalLink size={14} className="text-slate-400 flex-shrink-0" />
 </Link>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Lightbox */}
 {lightboxOpen && (
 <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
 <button className="absolute top-4 right-4 text-white hover:text-amber-400 z-10" onClick={() => setLightboxOpen(false)}>
 <X size={32} />
 </button>
 {allImages.length > 1 && (
 <>
 <button className="absolute left-4 text-white hover:text-amber-400 z-10"
 onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length); }}>
 <ChevronLeft size={40} />
 </button>
 <button className="absolute right-4 text-white hover:text-amber-400 z-10"
 onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % allImages.length); }}>
 <ChevronRight size={40} />
 </button>
 </>
 )}
 <img src={imgUrl(allImages[lightboxIndex])} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
 <div className="absolute bottom-4 text-white text-sm">{lightboxIndex + 1} / {allImages.length}</div>
 </div>
 )}
 </div>
 );
};

export default ArtifactDetail;
