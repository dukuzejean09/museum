import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchArtifactById } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { ArrowLeft, Tag, Sparkles, X, ChevronLeft, ChevronRight, ExternalLink, MapPin, Calendar } from 'lucide-react';
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

const ArtifactDetail = () => {
  const { t, lang } = useLanguage();
  const { id } = useParams();
  const [artifact, setArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await fetchArtifactById(id);
        setArtifact(data);
      } catch {
        toast.error('Failed to load artifact');
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

  if (!artifact) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">{t('common.noData')}</h1>
        <Link to="/artifacts" className="text-amber-600 hover:underline">{t('common.back')}</Link>
      </div>
    );
  }

  const allImages = artifact.images?.length > 0 ? artifact.images : (artifact.coverImage ? [artifact.coverImage] : []);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-72 sm:h-96 overflow-hidden bg-slate-800">
        {allImages[0] ? (
          <img src={imgUrl(allImages[0])} alt={getLocalizedText(artifact.title, lang)} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <Sparkles size={60} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="container mx-auto">
            <Link to="/artifacts" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition">
              <ArrowLeft size={16} /> {t('common.back')}
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded text-xs font-semibold uppercase">{artifact.type}</span>
              {artifact.year && (
                <span className="flex items-center gap-1 text-white/70 text-sm"><Calendar size={14} /> {artifact.year}</span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              {getLocalizedText(artifact.title, lang)}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main */}
          <div className="space-y-8">
            {/* Description */}
            {getLocalizedText(artifact.description, lang) && (
              <div>
                <h2 className="text-xl font-bold mb-3 dark:text-white">{t('exhibits.description') || 'Description'}</h2>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {getLocalizedText(artifact.description, lang)}
                </p>
              </div>
            )}

            {/* Historical Details */}
            {getLocalizedText(artifact.historicalDetails, lang) && (
              <div>
                <h2 className="text-xl font-bold mb-3 dark:text-white">{t('exhibits.historicalContext') || 'Historical Details'}</h2>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {getLocalizedText(artifact.historicalDetails, lang)}
                </p>
              </div>
            )}

            {/* Origin */}
            {getLocalizedText(artifact.origin, lang) && (
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold dark:text-white">Origin</h3>
                  <p className="text-slate-600 dark:text-slate-400">{getLocalizedText(artifact.origin, lang)}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {artifact.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {artifact.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm">
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Image Gallery */}
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
                      <img src={imgUrl(img)} alt={`Image ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Exhibitions */}
            {artifact.exhibitions?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="font-semibold mb-4 dark:text-white">{t('artifact.inExhibitions') || 'Found in Exhibitions'}</h3>
                <div className="space-y-3">
                  {artifact.exhibitions.map(ex => (
                    <Link
                      key={ex._id}
                      to={`/exhibitions/${ex._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
                        {ex.coverImage ? (
                          <img src={imgUrl(ex.coverImage)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={16} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium dark:text-white group-hover:text-amber-600 transition-colors truncate">
                          {getLocalizedText(ex.title, lang)}
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="font-semibold mb-4 dark:text-white">{t('artifact.inTrails') || 'Featured in Trails'}</h3>
                <div className="space-y-3">
                  {artifact.trails.map(trail => (
                    <Link
                      key={trail._id}
                      to={`/trails/${trail._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
                        {trail.coverImage ? (
                          <img src={imgUrl(trail.coverImage)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><Sparkles size={16} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium dark:text-white group-hover:text-amber-600 transition-colors truncate">
                          {getLocalizedText(trail.title, lang)}
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
