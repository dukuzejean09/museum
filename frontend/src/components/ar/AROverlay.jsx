import { Link } from 'react-router-dom';
import { X, ExternalLink, MapPin, Calendar, Tag } from 'lucide-react';
import AudioControls from './AudioControls';
import { useLanguage } from '../../i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const imgUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
};

/**
 * AR Overlay — floating content card displayed over the camera feed.
 */
const AROverlay = ({ entity, entityType, method, audioUrl, onDismiss }) => {
  const { t, getLocalized } = useLanguage();

  if (!entity) return null;

  const isExhibition = entityType === 'exhibition';
  const title = getLocalized(isExhibition ? entity.title : entity.name);
  const description = getLocalized(
    isExhibition
      ? (entity.shortDescription || entity.fullDescription)
      : entity.description
  );
  const image = isExhibition ? entity.coverImage : entity.image;
  const detailPath = isExhibition ? `/exhibitions/${entity._id}` : `/artifacts/${entity._id}`;

  const methodLabels = {
    qr: t('ar.methodQR'),
    opencv: t('ar.methodOpenCV'),
    yolo: t('ar.methodYOLO'),
    gpt4o: t('ar.methodAI'),
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 animate-slide-up">
      {/* Backdrop gradient */}
      <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-6 px-4">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition"
          aria-label={t('ar.dismiss')}
        >
          <X size={20} />
        </button>

        {/* Recognition method badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 backdrop-blur-sm">
            {methodLabels[method] || method}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 backdrop-blur-sm">
            {isExhibition ? t('ar.exhibition') : t('ar.artifact')}
          </span>
        </div>

        {/* Content card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
          <div className="flex gap-3 p-4">
            {/* Thumbnail */}
            {image && (
              <img
                src={imgUrl(image)}
                alt={title}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg leading-tight truncate">{title}</h3>
              <p className="text-white/70 text-sm mt-1 line-clamp-2">{description}</p>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {!isExhibition && entity.originLocation && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <MapPin size={10} />
                    {getLocalized(entity.originLocation)}
                  </span>
                )}
                {!isExhibition && entity.dateCreated && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <Calendar size={10} />
                    {entity.dateCreated}
                  </span>
                )}
                {!isExhibition && entity.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/50">
                    <Tag size={10} />
                    {entity.category}
                  </span>
                )}
                {isExhibition && entity.tags?.length > 0 && (
                  entity.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Audio player */}
          {audioUrl && (
            <div className="px-4 pb-3">
              <AudioControls audioUrl={audioUrl} />
            </div>
          )}

          {/* Actions */}
          <div className="flex border-t border-white/10">
            <Link
              to={detailPath}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-amber-400 text-sm font-medium hover:bg-white/5 transition"
            >
              <ExternalLink size={14} />
              {t('ar.viewDetails')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AROverlay;
