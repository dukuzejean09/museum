import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchStoryById } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, BookOpen, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
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

  const narrationUrl = story.narration && getLocalizedText(story.narration, lang);
  const mediaItems = story.media?.length > 0 ? story.media : [];
  const allImages = story.coverImage ? [story.coverImage, ...mediaItems] : mediaItems;
  const contentText = getLocalizedText(story.content, lang);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-72 sm:h-96 overflow-hidden bg-slate-800">
        {story.coverImage ? (
          <img src={imgUrl(story.coverImage)} alt={getLocalizedText(story.title, lang)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <BookOpen size={60} />
          </div>
        )}
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

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Narration Audio */}
            {narrationUrl && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
                <h2 className="text-lg font-semibold mb-3 text-amber-800 dark:text-amber-300">
                  {t('story.narration') || 'Listen to Narration'}
                </h2>
                <audio controls className="w-full" src={imgUrl(narrationUrl)}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

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

            {/* Media Gallery */}
            {allImages.length > 1 && (
              <div>
                <h2 className="text-xl font-bold mb-4 dark:text-white">{t('exhibition.gallery') || 'Gallery'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer group bg-slate-100 dark:bg-slate-800"
                      onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                    >
                      <img src={imgUrl(img)} alt={`Media ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

export default StoryDetail;
