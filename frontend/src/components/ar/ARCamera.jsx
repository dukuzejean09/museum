import { useRef, useEffect, useCallback, useState } from 'react';
import { Camera, SwitchCamera } from 'lucide-react';

/**
 * AR Camera component — manages the live camera feed.
 * Provides rear-facing camera with fallback to front camera.
 */
const ARCamera = ({ videoRef, onReady, onError, children }) => {
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [active, setActive] = useState(false);

  const startCamera = useCallback(async (facing = facingMode) => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setActive(true);
          onReady?.();
        };
      }
    } catch (err) {
      // Try fallback to front camera
      if (facing === 'environment') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setFacingMode('user');
              setActive(true);
              onReady?.();
            };
          }
        } catch {
          onError?.('Camera access denied');
        }
      } else {
        onError?.('Camera access denied');
      }
    }
  }, [facingMode, videoRef, onReady, onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Camera switch button */}
      {active && (
        <button
          onClick={switchCamera}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition z-10"
          aria-label="Switch camera"
        >
          <SwitchCamera size={20} />
        </button>
      )}

      {/* Loading state */}
      {!active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Camera size={48} className="animate-pulse text-amber-400" />
          <p className="mt-3 text-sm">Starting camera...</p>
        </div>
      )}

      {/* Children (overlays) render on top of the video */}
      {children}
    </div>
  );
};

export default ARCamera;
