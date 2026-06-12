import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchExhibitionById, fetchStories, fetchExhibitions, trackEvent } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { DetailPageSkeleton } from '../components/ui/LoadingSkeleton';
import {
 ArrowLeft, BookOpen, Image as ImageIcon, Clock, Tag, Share2,
 Volume2, Play, X, ChevronLeft, ChevronRight, ExternalLink, Sparkles
} from 'lucide-react';
import ArtifactSlideshow from '../components/ArtifactSlideshow';
import toast from 'react-hot-toast';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};
const audioUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};

const getLocalizedText = (field, lang) => {
 if (!field) return '';
 if (typeof field === 'string') return field;
 return field[lang] || field.en || field.fr || field.rw || '';
};

const tabs = ['overview', 'artifacts', 'stories', 'gallery'];

const ExhibitionDetail = () => {
 const { t, lang } = useLanguage();
 const { id } = useParams();
 const [exhibition, setExhibition] = useState(null);
 const [stories, setStories] = useState([]);
 const [relatedExhibitions, setRelatedExhibitions] = useState([]);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState('overview');
 const [lightboxOpen, setLightboxOpen] = useState(false);
 const [lightboxIndex, setLightboxIndex] = useState(0);
 const [showShare, setShowShare] = useState(false);

 useEffect(() => {
 const load = async () => {
 setLoading(true);
 try {
 const { data } = await fetchExhibitionById(id);
 setExhibition(data);

 // Track view
 trackEvent({ eventType: 'view', entityType: 'exhibition', entityId: id }).catch(() => {});

 // Load stories
 fetchStories({ exhibitionId: id })
 .then(res => {
 const raw = res.data;
 setStories(Array.isArray(raw) ? raw : raw?.data || raw?.stories || []);
 })
 .catch(() => setStories([]));

 // Load related exhibitions
 fetchExhibitions({ limit: 4, status: 'published' })
 .then(res => {
 const raw = res.data;
 const all = Array.isArray(raw) ? raw : raw?.data || raw?.exhibitions || [];
 setRelatedExhibitions(all.filter(e => e._id !== id).slice(0, 3));
 })
 .catch(() => {});
 } catch (err) {
 toast.error('Failed to load exhibition');
 } finally {
 setLoading(false);
 }
 };
 load();
 }, [id]);

 if (loading) {
 return (
 <DetailPageSkeleton />
 );
 }

 if (!exhibition) {
 return (
 <div className="container mx-auto p-6 text-center">
 <h1 className="text-2xl font-bold mb-4">{t('common.noData')}</h1>
 <Link to="/exhibitions" className="text-amber-600 hover:underline">{t('common.back')}</Link>
 </div>
 );
 }

 const allImages = [
 ...(exhibition.coverImage ? [exhibition.coverImage] : []),
 ...(exhibition.media?.images || []),
 ];
 const narrationSrc = audioUrl(
 getLocalizedText(exhibition.narration?.full, lang) || exhibition.narration?.full?.en
 );
 const shareUrl = window.location.href;
 const shareText = `Check out "${getLocalizedText(exhibition.title, lang)}" exhibition!`;

 return (
 <div>
 {/* Hero — fading slideshow of linked artifact images */}
 <ArtifactSlideshow
 artifacts={exhibition.artifacts || []}
 className="h-72 sm:h-96 bg-slate-800"
 interval={5000}
 overlay="bg-gradient-to-t from-black/80 via-black/30 to-transparent"
 >
 <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-10">
 <div className="container mx-auto">
 <Link to="/exhibitions" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition">
 <ArrowLeft size={16} /> {t('common.back')}
 </Link>
 <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
 {getLocalizedText(exhibition.title, lang)}
 </h1>
 <p className="text-slate-300 mt-2 max-w-2xl line-clamp-2">
 {getLocalizedText(exhibition.shortDescription, lang)}
 </p>
 </div>
 </div>
 </ArtifactSlideshow>

 <div className="container mx-auto px-4 py-8">
 {/* Tab Navigation */}
 <div className="flex gap-1 border-b border-slate-200 mb-8 overflow-x-auto">
 {tabs.map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
 activeTab === tab
 ? 'border-amber-600 text-amber-600'
 : 'border-transparent text-slate-500 hover:text-slate-700'
 }`}
 >
 {t(`exhibition.${tab}`)}
 </button>
 ))}
 </div>

 <div className="grid lg:grid-cols-[1fr_320px] gap-8">
 {/* Main Content */}
 <div>
 {/* Overview Tab */}
 {activeTab === 'overview' && (
 <div className="space-y-8">
 {getLocalizedText(exhibition.fullDescription || exhibition.description, lang) && (
 <div>
 <h2 className="text-xl font-bold mb-3">{t('exhibits.description')}</h2>
 <p className="text-slate-700 leading-relaxed whitespace-pre-line">
 {getLocalizedText(exhibition.fullDescription || exhibition.description, lang)}
 </p>
 </div>
 )}

 {getLocalizedText(exhibition.historicalSignificance, lang) && (
 <div>
 <h2 className="text-xl font-bold mb-3">{t('exhibits.historicalContext')}</h2>
 <p className="text-slate-700 leading-relaxed whitespace-pre-line">
 {getLocalizedText(exhibition.historicalSignificance, lang)}
 </p>
 </div>
 )}

 {/* Timeline */}
 {exhibition.timeline?.length > 0 && (
 <div>
 <h2 className="text-xl font-bold mb-4">{t('exhibition.timeline')}</h2>
 <div className="relative border-l-2 border-amber-300 ml-4 space-y-6">
 {exhibition.timeline.map((entry, i) => (
 <div key={i} className="relative pl-8">
 <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-600 border-2 border-white" />
 <span className="text-sm font-bold text-amber-600">{entry.year}</span>
 <p className="text-slate-700 mt-1">
 {getLocalizedText(entry.event, lang)}
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
 <span key={i} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">
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
 className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition group"
 >
 <div className="h-40 overflow-hidden bg-slate-100">
 {artifact.image ? (
 <img src={imgUrl(artifact.image)} alt={getLocalizedText(artifact.name, lang)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={32} /></div>
 )}
 </div>
 <div className="p-4">
 {artifact.category && (
 <span className="text-xs font-medium text-amber-600 uppercase">{artifact.category}</span>
 )}
 <h3 className="font-bold mt-1 group-hover:text-amber-600 transition-colors">
 {getLocalizedText(artifact.name, lang)}
 </h3>
 <p className="text-sm text-slate-600 mt-1 line-clamp-2">
 {getLocalizedText(artifact.description, lang)}
 </p>
 </div>
 </Link>
 ))}
 </div>
 ) : (
 <div className="text-center py-16 text-slate-500">
 <Sparkles size={40} className="mx-auto mb-3 opacity-40" />
 <p>{t('common.noData')}</p>
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
 <div key={story._id} className="bg-white rounded-2xl border border-slate-200 p-6">
 <h3 className="text-lg font-bold">{getLocalizedText(story.title, lang)}</h3>
 <p className="mt-2 text-slate-600 leading-relaxed whitespace-pre-line">
 {getLocalizedText(story.content, lang)}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-16 text-slate-500">
 <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
 <p>{t('common.noData')}</p>
 </div>
 )}
 </div>
 )}

 {/* Gallery Tab */}
 {activeTab === 'gallery' && (
 <div>
 {allImages.length > 0 ? (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 {allImages.map((img, i) => (
 <div
 key={i}
 className="aspect-square rounded-xl overflow-hidden cursor-pointer group bg-slate-100"
 onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
 >
 <img src={imgUrl(img)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-16 text-slate-500">
 <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
 <p>{t('common.noData')}</p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Audio Narration */}
 {narrationSrc && (
 <div className="bg-white rounded-2xl border border-slate-200 p-5">
 <div className="flex items-center gap-2 mb-3">
 <Volume2 size={18} className="text-amber-600" />
 <h3 className="font-semibold">{t('exhibits.audioNarration')}</h3>
 </div>
 <audio controls className="w-full" preload="metadata">
 <source src={narrationSrc} />
 </audio>
 </div>
 )}

 {/* Share */}
 <div className="relative">
 <button
 onClick={() => setShowShare(!showShare)}
 className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 transition font-semibold"
 >
 <Share2 size={18} />
 {t('exhibits.share')}
 </button>
 {showShare && (
 <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg p-4 space-y-2 z-10 border border-slate-200">
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
 <div className="bg-white rounded-2xl border border-slate-200 p-5">
 <h3 className="font-semibold mb-4">{t('exhibition.related')}</h3>
 <div className="space-y-3">
 {relatedExhibitions.map(rel => (
 <Link
 key={rel._id}
 to={`/exhibitions/${rel._id}`}
 className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition group"
 >
 <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
 {(rel.coverImage || rel.media?.images?.[0]) ? (
 <img src={imgUrl(rel.coverImage || rel.media?.images?.[0])} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={16} /></div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium group-hover:text-amber-600 transition-colors truncate">
 {getLocalizedText(rel.title, lang)}
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
