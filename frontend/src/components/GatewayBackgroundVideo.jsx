import { useRef, useEffect, useState, useCallback } from "react";

// Pre-extracted 20s clip (2:10–2:30 from full video), only 1.3MB
const GATEWAY_CLIP = "/museum-gateway-clip.mp4";

const GatewayBackgroundVideo = ({ overlayOpacity = 0.55, className = "" }) => {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [failed, setFailed] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const handleCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => setReady(true))
      .catch(() => setFailed(true));
  }, []);

  const handleError = useCallback(() => setFailed(true), []);

  // Reduced motion or failed — just show dark overlay
  if (prefersReducedMotion || failed) {
    return (
      <div
        className={`absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src={GATEWAY_CLIP}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        onCanPlay={handleCanPlay}
        onError={handleError}
        className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        style={{
          filter: "brightness(0.9)",
          top: "-5%",
          left: "-2%",
          width: "110%",
          height: "110%",
        }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />
    </div>
  );
};

export default GatewayBackgroundVideo;
