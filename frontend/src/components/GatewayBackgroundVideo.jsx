import { useRef, useEffect, useState, useCallback } from 'react';

const MUSEUM_VIDEO = '/museum-intro.mp4';

const PREFERRED_START = 130; // 2:10
const PREFERRED_END = 150;   // 2:30
const LOOP_DURATION = 20;    // seconds

const GatewayBackgroundVideo = ({ overlayOpacity = 0.55, className = '' }) => {
  const videoRef = useRef(null);
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(20);
  const [ready, setReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Loop the selected segment
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime >= endTimeRef.current || video.currentTime < startTimeRef.current) {
      video.currentTime = startTimeRef.current;
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const dur = video.duration;
    console.log('[GatewayVideo] duration:', dur);

    // If video is long enough, use preferred segment (2:10–2:30)
    // Otherwise loop from start or a reasonable portion
    if (dur >= PREFERRED_END) {
      startTimeRef.current = PREFERRED_START;
      endTimeRef.current = PREFERRED_END;
    } else if (dur >= LOOP_DURATION) {
      // Use last 20 seconds or middle portion
      startTimeRef.current = Math.max(0, dur - LOOP_DURATION);
      endTimeRef.current = dur - 0.5;
    } else {
      // Short video — loop entire thing
      startTimeRef.current = 0;
      endTimeRef.current = dur - 0.5;
    }

    video.currentTime = startTimeRef.current;
    video.play()
      .then(() => setReady(true))
      .catch((err) => {
        console.warn('[GatewayVideo] autoplay failed:', err);
        setFailed(true);
      });
  }, []);

  const handleError = useCallback((e) => {
    console.error('[GatewayVideo] video error:', e?.target?.error);
    setFailed(true);
  }, []);

  // If reduced motion or failed, show dark background only
  if (prefersReducedMotion || failed) {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
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
        onLoadedMetadata={handleLoadedMetadata}
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
