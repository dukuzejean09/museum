import { useRef, useEffect, useCallback, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Home, Scan, Info, X } from 'lucide-react';
import ARCamera from '../components/ar/ARCamera';
import AROverlay from '../components/ar/AROverlay';
import RecognitionStatus from '../components/ar/RecognitionStatus';
import DetectionBox from '../components/ar/DetectionBox';
import useARRecognition from '../hooks/useARRecognition';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchExhibitionById, fetchArtifactById } from '../api';

/**
 * AR Scanner Page — /ar
 *
 * Full-screen camera view with real-time detection:
 * - OpenCV feature matching (every 500ms)
 * - YOLO object detection with bounding boxes (every 3s)
 * - GPT-4o Vision auto-triggered by YOLO or manual "Identify" button
 * - Floating content overlay on recognition
 * - Audio narration
 */
const ARScanner = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const ar = useARRecognition({
    videoRef,
    canvasRef,
    enabled: true,
  });

  // Track container size for scaling YOLO bounding boxes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle deep-link from QR code scanned outside the app
  useEffect(() => {
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    if (type && id) {
      loadEntityFromParams(type, id);
    }
  }, [searchParams]);

  const loadEntityFromParams = useCallback(async (type, id) => {
    try {
      let data;
      if (type === 'artifact') {
        const res = await fetchArtifactById(id);
        data = res.data?.data || res.data;
      } else {
        const res = await fetchExhibitionById(id);
        data = res.data?.data || res.data;
      }
    } catch {
      // Entity not found — continue scanning
    }
  }, []);

  const handleCameraReady = useCallback(() => {
    ar.start();
    // Update container size once camera starts
    if (containerRef.current) {
      setContainerSize({
        w: containerRef.current.clientWidth,
        h: containerRef.current.clientHeight,
      });
    }
  }, [ar]);

  const handleCameraError = useCallback(() => {}, []);

  // Dismiss the "not found" error message
  const dismissError = () => {
    ar.dismiss();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ─── Top bar: Home button (always visible) ─── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition"
        >
          <Home size={18} />
          <span className="text-sm font-medium">{t('ar.home')}</span>
        </Link>
      </div>

      {/* Camera feed + overlays */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <ARCamera
          videoRef={videoRef}
          onReady={handleCameraReady}
          onError={handleCameraError}
        >
          {/* Recognition status */}
          <RecognitionStatus
            scanning={ar.scanning}
            loading={ar.loading}
            identifying={ar.identifying}
            opencvReady={ar.opencvReady}
            performanceLevel={ar.performanceLevel}
            error={null}
          />

          {/* YOLO detection bounding box */}
          {ar.yoloDetection && !ar.entity && (
            <DetectionBox
              bbox={ar.yoloDetection.bbox}
              label={ar.yoloDetection.class_name}
              confidence={ar.yoloDetection.confidence}
              videoWidth={videoRef.current?.videoWidth || 1280}
              videoHeight={videoRef.current?.videoHeight || 720}
              containerWidth={containerSize.w}
              containerHeight={containerSize.h}
            />
          )}

          {/* "Not found" message panel — shown when AI couldn't match an exhibit */}
          {ar.error && !ar.entity && (
            <div className="absolute inset-x-4 bottom-4 z-20 animate-slide-up">
              <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-amber-500/30 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm mb-1">{t('ar.notRecognized')}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{ar.error}</p>
                  </div>
                  <button
                    onClick={dismissError}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 transition flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
                <button
                  onClick={() => { dismissError(); ar.identifyWithAI(); }}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 py-2.5 rounded-xl transition text-sm font-medium"
                >
                  <Scan size={16} />
                  {t('ar.tryAgain')}
                </button>
              </div>
            </div>
          )}

          {/* Scanning viewfinder (shown when no entity detected and no error) */}
          {!ar.entity && !ar.error && !ar.loading && !ar.identifying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

                {/* Scanning line animation */}
                {ar.scanning && (
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan-line" />
                )}

                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/40 text-sm text-center px-4">
                    {ar.identifying
                      ? t('ar.analyzingObject')
                      : t('ar.pointCamera')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AR Overlay — entity info card */}
          <AROverlay
            entity={ar.entity}
            entityType={ar.entityType}
            method={ar.method}
            audioUrl={ar.audioUrl}
            onDismiss={ar.dismiss}
          />
        </ARCamera>
      </div>

      {/* Bottom toolbar */}
      <div className="flex-shrink-0 bg-black/90 backdrop-blur-sm border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-center px-6 py-4">
          {/* Identify button (manual GPT-4o trigger) */}
          {!ar.entity && !ar.error && (
            <button
              onClick={ar.identifyWithAI}
              disabled={ar.identifying || ar.loading}
              className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ar.identifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('ar.identifying')}
                </>
              ) : (
                <>
                  <Search size={18} />
                  {t('ar.identify')}
                </>
              )}
            </button>
          )}

          {/* Scan again button (when overlay is shown) */}
          {ar.entity && (
            <button
              onClick={ar.dismiss}
              className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition"
            >
              <Scan size={18} />
              {t('ar.scanAgain')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARScanner;
