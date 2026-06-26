import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchExhibitionById, fetchStories, fetchExhibitions, trackEvent } from '../api';
import { useLanguage, getLocalizedText } from '../i18n/LanguageContext';
import { DetailPageSkeleton } from '../components/ui/LoadingSkeleton';
import {
 ArrowLeft, BookOpen, Image as ImageIcon, Clock, Tag, Share2,
 Play, X, ChevronLeft, ChevronRight, ExternalLink, Sparkles
} from 'lucide-react';
import ArtifactSlideshow from '../components/ArtifactSlideshow';
import NarrationPlayer from '../components/ui/NarrationPlayer';
import toast from 'react-hot-toast';
import { useRealtimeEntity } from '../hooks/useRealtimeStore';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};
const audioUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};

const tabs = ['overview', 'artifacts', 'stories', 'gallery'];

const ExhibitionDetail = () => {
 const { t, lang, getLocalized } = useLanguage();
 const { id } = useParams();
 const [activeTab, setActiveTab] = useState('overview');
 const [lightboxOpen, setLightboxOpen] = useState(false);
 const [lightboxIndex, setLightboxIndex] = useState(0);
 const [showShare, setShowShare] = useState(false);

 // Real-time updates for this specific exhibition
 useRealtimeEntity('exhibition', id, ['exhibition', id]);

 const { data: exhibition, isLoading: loading } = useQuery({
   queryKey: ['exhibition', id],
   queryFn: async () => {
     const { data } = await fetchExhibitionById(id);
     trackEvent({ eventType: 'view', entityType: 'exhibition', entityId: id }).catch(() => {});
     return data;
   },
   staleTime: 5 * 60 * 1000,
   enabled: !!id,
 });

 const { data: stories = [] } = useQuery({
   queryKey: ['stories', { exhibitionId: id }],
   queryFn: () => fetchStories({ exhibitionId: id }).then(res => {
     const raw = res.data;
     return Array.isArray(raw) ? raw : raw?.data || raw?.stories || [];
   }),
   staleTime: 5 * 60 * 1000,
   enabled: !!id,
 });

 const { data: relatedExhibitions = [] } = useQuery({
   queryKey: ['related-exhibitions', id],
   queryFn: () => fetchExhibitions({ limit: 4, status: 'published' }).then(res => {
     const raw = res.data;
     const all = Array.isArray(raw) ? raw : raw?.data || raw?.exhibitions || [];
     return all.filter(e => e._id !== id).slice(0, 3);
   }),
   staleTime: 5 * 60 * 1000,
   enabled: !!id,
 });

 if (loading) {
 return (
 <DetailPageSkeleton />
 );
 }

 if (!exhibition) {
 return (
 <div className="container mx-auto p-6 text-center">
 <h1 className="text-2xl font-bold mb-4 dark:text-white">{t('common.noData')}</h1>
 <Link to="/exhibitions" className="text-amber-600 hover:underline">{t('common.back')}</Link>
 </div>
 );
 }

 const allImages = [
 ...(exhibition.coverImage ? [exhibition.coverImage] : []),
 ...(exhibition.media?.images || []),
 ];
 const narrationSrc = audioUrl(
 getLocalizedText(exhibition.narration?.full, lang) || exhibition.narration?.full?.en || exhibition.narrationAudioUrl
 );
 const narrationText = [getLocalized(exhibition.title), getLocalized(exhibition.fullDescription || exhibition.description), getLocalized(exhibition.historicalSignificance)].filter(Boolean).join('. ');
 const shareUrl = window.location.href;
 const shareText = `Check out "${getLocalized(exhibition.title)}" exhibition!`;

 return (
 <div>
 {/* Hero — fading slideshow of linked artifact images */}
 <ArtifactSlideshow
 artifacts={exhibition.artifacts || []}
 className="h-72 sm:h-96 bg-slate-800"
 interval={5000}
 overlay="bg-gradient-to-t from-black/80 via-black/30 to-transparent"
 >
 <div className="detail-hero-content">
 <div className="container mx-auto">
 <Link to="/exhibitions" className="back-link">
 <ArrowLeft size={16} /> {t('common.back')}
 </Link>
 <h1>
 {getLocalized(exhibition.title)}
 </h1>
 <p className="text-slate-300 mt-2 max-w-2xl line-clamp-2">
 {getLocalized(exhibition.shortDescription)}
 </p>
 </div>
 </div>
 </ArtifactSlideshow>

 <div className="page-container">
 {/* Tab Navigation */}
 <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-8 overflow-x-auto">
 {tabs.map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
 activeTab === tab
 ? 'border-amber-600 text-amber-600 dark:text-amber-400'
 : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
 }`}
 >
 {t(`exhibition.${tab}`)}
 </button>
 ))}
 </div>

 <div className="detail-layout">
 {/* Main Content */}
 <div>
 {/* Overview Tab */}
 {activeTab === 'overview' && (
 <div className="space-y-8">
 {getLocalized(exhibition.fullDescription || exhibition.description) && (
 <div>
 <h2 className="detail-section-title">{t('exhibits.description')}</h2>
 <p className="detail-text whitespace-pre-line">
 {getLocalized(exhibition.fullDescription || exhibition.description)}
 </p>
 </div>
 )}

 {getLocalized(exhibition.historicalSignificance) && (
 <div>
 <h2 className="detail-section-title">{t('exhibits.historicalContext')}</h2>
 <p className="detail-text whitespace-pre-line">
 {getLocalized(exhibition.historicalSignificance)}
 </p>
 </div>
 )}

 {/* Timeline */}
 {exhibition.timeline?.length > 0 && (
 <div>
 <h2 className="detail-section-title">{t('exhibition.timeline')}</h2>
 <div className="relative border-l-2 border-amber-300 dark:border-amber-700 ml-4 space-y-6">
 {exhibition.timeline.map((entry, i) => (
 <div key={i} className="relative pl-8">
 <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-600 border-2 border-white dark:border-slate-900" />
 <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{entry.year}</span>
 <p className="text-slate-700 dark:text-slate-300 mt-1">
 {getLocalized(entry.event)}
 </p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Tags */}
 {exhibition.tags?.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {exhibition.tags.map((tag, i) => (
 <span key={i} className="tag inline-flex items-center gap-1">
 <Tag size={12} /> {tag}
 </span>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Artifacts Tab */}
 {activeTab === 'artifacts' && (
 <div>
 {exhibition.artifacts?.length > 0 ? (
 <div className="grid gap-4 sm:grid-cols-2">
 {exhibition.artifacts.map(artifact => (
 <Link
 key={artifact._id}
 to={`/artifacts/${artifact._id}`}
 className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition group"
 >
 <div className="card-image" style={{ height: '10rem' }}>
 {artifact.image ? (
 <img src={imgUrl(artifact.image)} alt={getLocalized(artifact.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 ) : (
 <div className="card-image-placeholder"><Sparkles size={32} /></div>
 )}
 </div>
 <div className="card-body">
 {artifact.category && (
 <span className="tag" style={{ textTransform: 'uppercase' }}>{artifact.category}</span>
 )}
 <h3 className="card-title mt-1">
 {getLocalized(artifact.name)}
 </h3>
 <p className="card-desc">
 {getLocalized(artifact.description)}
 </p>
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <div className="empty-state">
 <Sparkles size={40} className="empty-state-icon" />
 <p className="empty-state-title">{t('common.noData')}</p>
 </div>
 )}
 </div>
 )}

 {/* Stories Tab */}
 {activeTab === 'stories' && (
 <div>
 {stories.length > 0 ? (
 <div className="space-y-6">
 {stories.map(story => (
 <div key={story._id} className="card">
 <h3 className="text-lg font-bold dark:text-white">{getLocalized(story.title)}</h3>
 <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
 {getLocalized(story.content)}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <div className="empty-state">
 <BookOpen size={40} className="empty-state-icon" />
 <p className="empty-state-title">{t('common.noData')}</p>
 </div>
 )}
 </div>
 )}

 {/* Gallery Tab */}
 {activeTab === 'gallery' && (
 <div>
 {allImages.length > 0 ? (
 <div className="gallery-grid">
 {allImages.map((img, i) => (
 <div
 key={i}
 className="gallery-item"
 onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
 >
 <img src={imgUrl(img)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 </div>
 ))}
 </div>
 ) : (
 <div className="empty-state">
 <ImageIcon size={40} className="empty-state-icon" />
 <p className="empty-state-title">{t('common.noData')}</p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Audio Narration */}
 <NarrationPlayer
 audioSrc={narrationSrc}
 text={narrationText}
 title={t('exhibits.audioNarration')}
 lang={lang}
 />

 {/* Share */}
 <div className="relative">
 <button
 onClick={() => setShowShare(!showShare)}
 className="btn btn-primary btn-lg w-full"
 >
 <Share2 size={18} />
 {t('exhibits.share')}
 </button>
 {showShare && (
 <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 space-y-2 z-10 border border-slate-200 dark:border-slate-700">
 <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer"
 className="block w-full text-center py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">WhatsApp</a>
 <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
 className="block w-full text-center py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition">Twitter</a>
 <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
 className="block w-full text-center py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Facebook</a>
 </div>
 )}
 </div>

 {/* Related Exhibitions */}
 {relatedExhibitions.length > 0 && (
 <div className="sidebar-card">
 <h3 className="sidebar-card-title">{t('exhibition.related')}</h3>
 <div className="space-y-3">
 {relatedExhibitions.map(rel => (
 <Link
 key={rel._id}
 to={`/exhibitions/${rel._id}`}
 className="sidebar-link"
 >
 <div className="sidebar-thumb">
 {(rel.coverImage || rel.media?.images?.[0]) ? (
 <img src={imgUrl(rel.coverImage || rel.media?.images?.[0])} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={16} /></div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium dark:text-white group-hover:text-amber-600 transition-colors truncate">
 {getLocalized(rel.title)}
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

export default ExhibitionDetail;
