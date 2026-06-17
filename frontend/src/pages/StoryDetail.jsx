import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchStoryById } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { DetailPageSkeleton } from '../components/ui/LoadingSkeleton';
import NarrationPlayer from '../components/ui/NarrationPlayer';
import toast from 'react-hot-toast';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (path) => {
 if (!path) return null;
 return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};

const getLocalizedText = (field, lang) => {
 if (!field) return '';
 if (typeof field === 'string') return field;
 return field[lang] || field.en || field.fr || field.rw || '';
};

const StoryDetail = () => {
 const { t, lang } = useLanguage();
 const { id } = useParams();
 const [story, setStory] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const load = async () => {
 setLoading(true);
 try {
 const { data } = await fetchStoryById(id);
 setStory(data);
 } catch {
 toast.error('Failed to load story');
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

 if (!story) {
 return (
 <div className="container mx-auto p-6 text-center">
 <h1 className="text-2xl font-bold mb-4 dark:text-white">{t('common.noData') || 'Not found'}</h1>
 <Link to="/stories" className="text-amber-600 hover:underline">{t('common.back') || 'Back'}</Link>
 </div>
 );
 }

 const contentText = getLocalizedText(story.content, lang);

 return (
 <div>
 {/* Hero */}
 <div className="relative h-72 sm:h-96 overflow-hidden bg-slate-800">
 <div className="w-full h-full flex items-center justify-center text-slate-500">
 <BookOpen size={60} />
 </div>
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
 <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
 <div className="container mx-auto">
 <Link to="/stories" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition">
 <ArrowLeft size={16} /> {t('common.back') || 'Back'}
 </Link>
 <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
 {getLocalizedText(story.title, lang)}
 </h1>
 </div>
 </div>
 </div>

 <div className="page-container">
 <div className="grid lg:grid-cols-[1fr_320px] gap-8">
 {/* Main Content */}
 <div className="space-y-8">
 {/* Story Content */}
 {contentText && (
 <div>
 <h2 className="text-xl font-bold mb-3 dark:text-white">{t('story.content') || 'Story'}</h2>
 <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
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
 text={[getLocalizedText(story.title, lang), getLocalizedText(story.content, lang)].filter(Boolean).join('. ')}
 title={t('exhibits.audioNarration') || 'Audio Narration'}
 lang={lang}
 />

 {/* Linked Exhibition */}
 {story.exhibitionId && (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
 <h3 className="font-semibold mb-4 dark:text-white">{t('story.exhibition') || 'Exhibition'}</h3>
 <Link
 to={`/exhibitions/${story.exhibitionId._id || story.exhibitionId}`}
 className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
 >
 <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
 {story.exhibitionId.coverImage ? (
 <img src={imgUrl(story.exhibitionId.coverImage)} alt="" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={16} /></div>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium dark:text-white group-hover:text-amber-600 transition-colors truncate">
 {getLocalizedText(story.exhibitionId.title, lang) || t('story.viewExhibition') || 'View Exhibition'}
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
