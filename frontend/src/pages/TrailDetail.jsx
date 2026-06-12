import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTrailById } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, MapPin, Clock, ChevronRight, ChevronLeft, Check, Sparkles, ExternalLink } from 'lucide-react';
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

const TrailDetail = () => {
  const { t, lang } = useLanguage();
  const { id } = useParams();
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStop, setCurrentStop] = useState(-1); // -1 = intro view
  const [visitedStops, setVisitedStops] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await fetchTrailById(id);
        setTrail(data);
      } catch {
        toast.error('Failed to load trail');
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

  if (!trail) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">{t('common.noData')}</h1>
        <Link to="/trails" className="text-amber-600 hover:underline">{t('common.back')}</Link>
      </div>
    );
  }

  const stops = (trail.stops || []).sort((a, b) => a.order - b.order);
  const totalStops = stops.length;
  const progress = visitedStops.size / Math.max(totalStops, 1);
  const isIntro = currentStop === -1;
  const stop = isIntro ? null : stops[currentStop];
  const artifact = stop?.artifact;

  const goToStop = (idx) => {
    setCurrentStop(idx);
    if (idx >= 0) {
      setVisitedStops(prev => new Set([...prev, idx]));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="relative h-64 sm:h-80 overflow-hidden bg-slate-800">
        {(isIntro ? trail.coverImage : artifact?.coverImage || trail.coverImage) ? (
          <img
            src={imgUrl(isIntro ? trail.coverImage : artifact?.coverImage || trail.coverImage)}
            alt={getLocalizedText(trail.title, lang)}
            className="w-full h-full object-cover transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <Sparkles size={60} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <Link to="/trails" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-2 transition">
              <ArrowLeft size={16} /> {t('common.back') || 'Back'}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {getLocalizedText(trail.title, lang)}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-white/70 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} /> {totalStops} stops</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {trail.estimatedMinutes || 30} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium dark:text-white">
              {isIntro ? 'Introduction' : `Stop ${currentStop + 1} of ${totalStops}`}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {Math.round(progress * 100)}% complete
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {/* Stop indicators */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => goToStop(-1)}
              className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition ${
                isIntro
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
              }`}
            >
              i
            </button>
            {stops.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToStop(idx)}
                className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition ${
                  currentStop === idx
                    ? 'bg-amber-600 text-white'
                    : visitedStops.has(idx)
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                }`}
              >
                {visitedStops.has(idx) && currentStop !== idx ? <Check size={14} className="mx-auto" /> : idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Introduction */}
        {isIntro && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold dark:text-white mb-3">{t('trail.introduction') || 'Introduction'}</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {getLocalizedText(trail.introduction || trail.description, lang)}
              </p>
            </div>

            {/* Preview of stops */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold dark:text-white mb-4">{t('trail.stops') || 'Trail Stops'} ({totalStops})</h3>
              <div className="space-y-3">
                {stops.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {s.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white truncate">
                        {getLocalizedText(s.artifact?.title, lang) || `Stop ${s.order}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => goToStop(0)}
              className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
            >
              {t('trail.startTrail') || 'Start Trail'} <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Stop View */}
        {!isIntro && stop && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Artifact Card */}
            {artifact && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {artifact.coverImage && (
                  <img
                    src={imgUrl(artifact.coverImage)}
                    alt={getLocalizedText(artifact.title, lang)}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-6">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">{artifact.type}</span>
                  <h2 className="text-xl font-bold dark:text-white mt-1">
                    {getLocalizedText(artifact.title, lang)}
                  </h2>
                  <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {getLocalizedText(artifact.description, lang)}
                  </p>

                  {/* Stop-specific description */}
                  {getLocalizedText(stop.description, lang) && (
                    <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-800 dark:text-amber-300 text-sm italic">
                        {getLocalizedText(stop.description, lang)}
                      </p>
                    </div>
                  )}

                  <Link
                    to={`/artifacts/${artifact._id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline text-sm font-medium"
                  >
                    {t('trail.viewArtifact') || 'View full artifact details'} <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => goToStop(currentStop - 1)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition font-medium"
              >
                <ChevronLeft size={18} /> {currentStop === 0 ? 'Intro' : `Stop ${currentStop}`}
              </button>

              {currentStop < totalStops - 1 ? (
                <button
                  onClick={() => goToStop(currentStop + 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition font-medium"
                >
                  Stop {currentStop + 2} <ChevronRight size={18} />
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                    {t('trail.completed') || 'Trail Complete!'}
                  </p>
                  <Link to="/trails" className="text-amber-600 hover:underline text-sm">
                    {t('trail.browseMore') || 'Browse more trails'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailDetail;
