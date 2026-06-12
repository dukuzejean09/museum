import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrails } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { Sparkles, Clock, MapPin, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const imageUrl = (path) => {
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

const difficultyColors = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  detailed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

const Trails = () => {
  const { t, lang } = useLanguage();
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchTrails({ limit: 20 });
      if (Array.isArray(data)) {
        setTrails(data);
      } else {
        setTrails(data.data || []);
      }
    } catch {
      toast.error('Failed to load trails');
      setTrails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrails(); }, [loadTrails]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white">{t('trail.title') || 'Guided Trails'}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{t('trail.subtitle') || 'Explore the museum through curated guided journeys'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </div>
      ) : trails.length > 0 ? (
        <div className="space-y-6">
          {trails.map((trail) => (
            <Link
              key={trail._id}
              to={`/trails/${trail._id}`}
              className="flex flex-col sm:flex-row bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative sm:w-72 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
                {trail.coverImage ? (
                  <img
                    src={imageUrl(trail.coverImage)}
                    alt={getLocalizedText(trail.title, lang)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Sparkles size={40} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${difficultyColors[trail.difficulty] || difficultyColors.easy}`}>
                      {trail.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                      <Clock size={12} /> {trail.estimatedMinutes || 30} min
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                      <MapPin size={12} /> {trail.stopCount || trail.stops?.length || 0} stops
                    </span>
                  </div>
                  <h2 className="text-xl font-bold dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {getLocalizedText(trail.title, lang)}
                  </h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 line-clamp-2">
                    {getLocalizedText(trail.description || trail.introduction, lang)}
                  </p>
                </div>

                <div className="mt-4 flex items-center text-amber-600 dark:text-amber-400 font-semibold text-sm group-hover:gap-2 transition-all">
                  {t('trail.startTrail') || 'Start Trail'} <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Sparkles size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{t('common.noData') || 'No trails available'}</p>
        </div>
      )}
    </div>
  );
};

export default Trails;
