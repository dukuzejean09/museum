import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchExhibitions } from '../api';
import { MapPin, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getLocalizedText = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

const FloorMap = () => {
  const { t, lang } = useLanguage();
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExhibitions({ status: 'published' })
      .then(res => {
        const data = res.data;
        setExhibitions(Array.isArray(data) ? data : data?.exhibitions || data?.docs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
          <MapPin size={32} className="text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">{t('map.title')}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">{t('map.subtitle')}</p>
      </div>

      {exhibitions.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {exhibitions.map((ex, i) => {
            const coverSrc = ex.coverImage
              ? (ex.coverImage.startsWith('http') ? ex.coverImage : `${API_BASE.replace('/api', '')}${ex.coverImage}`)
              : null;
            return (
              <Link
                key={ex._id}
                to={`/exhibitions/${ex._id}`}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-amber-400 transition group"
              >
                <div className="h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {coverSrc ? (
                    <img src={coverSrc} alt={getLocalizedText(ex.title, lang)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Sparkles size={40} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold dark:text-white group-hover:text-amber-600 transition-colors">
                      {getLocalizedText(ex.title, lang)}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {getLocalizedText(ex.shortDescription, lang)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FloorMap;
