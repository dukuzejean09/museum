import { Scan, Loader2, Wifi, WifiOff, Eye, Cpu } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Recognition status indicator — shows scanning state and pipeline status.
 */
const RecognitionStatus = ({ scanning, loading, identifying, opencvReady, performanceLevel, error }) => {
  const { t } = useLanguage();

  const levelLabels = {
    3: t('ar.levelFull'),
    2: t('ar.levelNoYOLO'),
    1: t('ar.levelOpenCVOnly'),
    0: t('ar.levelManual'),
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* Scanning indicator */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
        {identifying ? (
          <>
            <Loader2 size={14} className="animate-spin text-amber-400" />
            {t('ar.identifying')}
          </>
        ) : loading ? (
          <>
            <Loader2 size={14} className="animate-spin text-amber-400" />
            {t('ar.loading')}
          </>
        ) : scanning ? (
          <>
            <Scan size={14} className="text-green-400 animate-pulse" />
            {t('ar.scanning')}
          </>
        ) : (
          <>
            <Scan size={14} className="text-white/50" />
            {t('ar.ready')}
          </>
        )}
      </div>

      {/* Performance level */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white/60 text-[10px]">
        <Cpu size={10} />
        {levelLabels[performanceLevel] || 'Unknown'}
        {opencvReady && <Eye size={10} className="text-green-400" />}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm text-red-300 text-xs max-w-[200px]">
          {error}
        </div>
      )}
    </div>
  );
};

export default RecognitionStatus;
