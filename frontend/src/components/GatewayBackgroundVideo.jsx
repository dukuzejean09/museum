import { useRef, useEffect, useState, useCallback } from 'react';

const MUSEUM_VIDEO = '/museum-intro.mp4';

const START_TIME = 130; // 2:10
const END_TIME = 150;   // 2:30

const GatewayBackgroundVideo = ({ overlayOpacity = 0.55, className = '' }) => {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [posterUrl, setPosterUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Extract a poster frame from the video at START_TIME
  useEffect(() => {
    if (!prefersReducedMotion && !failed) return;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.src = MUSEUM_VIDEO;
    video.currentTime = START_TIME;
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPosterUrl(canvas.toDataURL('image/jpeg', 0.8));
      } catch {
        // CORS or other error — fallback to no poster
      }
      video.remove();
    }, { once: true });
    video.addEventListener('error', () => video.remove(), { once: true });
  }, [prefersReducedMotion, failed]);

  // Loop the segment 2:10 → 2:30
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime >= END_TIME || video.currentTime < START_TIME) {
      video.currentTime = START_TIME;
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = START_TIME;
    video.play().then(() => setReady(true)).catch(() => setFailed(true));
  }, []);

  const handleError = useCallback(() => setFailed(true), []);

  // If reduced motion or failed, show static poster
  if (prefersReducedMotion || failed) {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <video
        ref={videoRef}
        src={MUSEUM_VIDEO}
        muted
        playsInline
        preload="auto"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ filter: 'brightness(0.9)' }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />
      {/* Subtle blend gradient for bottom content */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
    </div>
  );
};

export default GatewayBackgroundVideo;
