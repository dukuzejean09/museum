import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchStoryById } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { DetailPageSkeleton } from '../components/ui/LoadingSkeleton';
import NarrationPlayer from '../components/ui/NarrationPlayer';
import toast from 'react-hot-toast';
import { useRealtimeEntity } from '../hooks/useRealtimeStore';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};

const StoryDetail = () => {
 const { t, lang, getLocalized } = useLanguage();
 const { id } = useParams();

 useRealtimeEntity('story', id, ['story', id]);

 const { data: story, isLoading: loading } = useQuery({
   queryKey: ['story', id],
   queryFn: () => fetchStoryById(id).then(r => r.data),
   staleTime: 5 * 60 * 1000,
   enabled: !!id,
 });

 if (loading) {
 return (
 <DetailPageSkeleton />
 );
 }

 if (!story) {
 return (
 <div className="container mx-auto p-6 text-center">
 <h1 className="text-2xl font-bold mb-4">{t('common.noData') || 'Not found'}</h1>
 <Link to="/stories" className="text-amber-600 hover:underline">{t('common.back') || 'Back'}</Link>
 </div>
 );
 }

 const contentText = getLocalized(story.content);

 return (
 <div>
 {/* Hero */}
 <div className="detail-hero">
 <div className="w-full h-full flex items-center justify-center text-slate-400">
 <BookOpen size={60} />
 </div>
 <div className="detail-hero-overlay" />
 <div className="detail-hero-content">
 <div className="container mx-auto">
 <Link to="/stories" className="back-link">
 <ArrowLeft size={16} /> {t('common.back') || 'Back'}
 </Link>
 <h1>
 {getLocalized(story.title)}
 </h1>
 </div>
 </div>
 </div>

 <div className="page-container">
 <div className="detail-layout">
 {/* Main Content */}
 <div className="space-y-8">
 {/* Story Content */}
 {contentText && (
 <div>
 <h2 className="detail-section-title">{t('story.content') || 'Story'}</h2>
 <div className="detail-text space-y-4">
 {contentText.split('\n').filter(p => p.trim()).map((paragraph, i) => (
 <p key={i}>{paragraph}</p>
 ))}
 </div>
 </div>
 )}

 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Audio Narration */}
 <NarrationPlayer
 text={[getLocalized(story.title), getLocalized(story.content)].filter(Boolean).join('. ')}
 title={t('exhibits.audioNarration') || 'Audio Narration'}
 lang={lang}
 />

 {/* Linked Exhibition */}
 {story.exhibitionId && (
 <div className="sidebar-card">
 <h3 className="sidebar-card-title">{t('story.exhibition') || 'Exhibition'}</h3>
 <Link
 to={`/exhibitions/${story.exhibitionId._id || story.exhibitionId}`}
 className="sidebar-link"
 >
 <div className="sidebar-thumb">
 {story.exhibitionId.coverImage ? (
 <img src={imgUrl(story.exhibitionId.coverImage)} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={16} /></div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium group-hover:text-amber-600 transition-colors truncate">
 {getLocalized(story.exhibitionId.title) || t('story.viewExhibition') || 'View Exhibition'}
 </p>
 </div>
 <ExternalLink size={14} className="text-slate-400 flex-shrink-0" />
 </Link>
 </div>
 )}
 </div>
 </div>
 </div>

 </div>
 );
};

export default StoryDetail;
