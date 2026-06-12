import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrails } from '../api';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const getImageUrl = (path) => {
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

const Trail = () => {
  const { t, lang } = useLanguage();
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrails()
      .then(res => {
        const raw = res.data;
        const arr = Array.isArray(raw) ? raw : raw?.data || [];
        setTrails(arr);
      })
      .catch((err) => {
        console.error('Failed to fetch trails:', err);
        setError(err.message);
        setTrails([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl text-center">
        <Compass size={48} className="mx-auto mb-4 text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400">Failed to load trails. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Compass size={16} />
          {t('trail.discover')}
        </div>
        <h1 className="text-3xl font-bold dark:text-white mb-3">{t('trail.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t('trail.intro')}</p>
      </div>

      {trails.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <Compass size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('trail.noEvents')}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trails.map((trail) => {
            const cover = getImageUrl(trail.previewImage || trail.imageUrl || trail.exhibition?.coverImage);
            const title = getLocalizedText(trail.title, lang);
            const hook = getLocalizedText(trail.hookSentence, lang);
            const teaser = getLocalizedText(trail.teaserDescription, lang);
            const cta = getLocalizedText(trail.callToAction, lang) || t('trail.discoverMore');
            const exhibitionTitle = trail.exhibition ? getLocalizedText(trail.exhibition.title, lang) : '';
            const linkTo = trail.exhibition ? `/exhibitions/${trail.exhibition._id || trail.parentId}` : `/exhibitions`;

            return (
              <Link
                key={trail._id}
                to={linkTo}
                className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-amber-400 transition-all duration-300"
              >
                {cover && (
                  <div className="relative h-48 overflow-hidden">
                    <img src={cover} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {trail.isFeatured && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Sparkles size={12} /> Featured
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  {exhibitionTitle && (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">{exhibitionTitle}</p>
                  )}
                  <h3 className="text-lg font-bold dark:text-white mb-2 group-hover:text-amber-600 transition-colors">{title}</h3>
                  {hook && <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-2">"{hook}"</p>}
                  {teaser && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{teaser}</p>}
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-2.5 transition-all">
                    {cta} <ArrowRight size={16} />
                  </span>
                </div>

                {trail.discoveryTags?.length > 0 && (
                  <div className="px-5 pb-4 flex flex-wrap gap-1">
                    {trail.discoveryTags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Trail;
