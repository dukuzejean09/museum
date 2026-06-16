import { useCallback, useState } from 'react';

// YOLO is proxied through the backend at /api/yolo/*
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const YOLO_URL = `${API_BASE}/yolo`;

/**
 * Hook for YOLO detection via the microservice.
 */
export default function useYOLO({ enabled = true }) {
  const [detecting, setDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [available, setAvailable] = useState(null); // null = unknown, true/false

  // Check if YOLO service is available
  const checkAvailability = useCallback(async () => {
    try {
      const res = await fetch(`${YOLO_URL}/health`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      const isUp = data.status === 'ok' && data.model_loaded;
      setAvailable(isUp);
      return isUp;
    } catch {
      setAvailable(false);
      return false;
    }
  }, []);

  // Detect objects in a frame blob
  const detect = useCallback(async (frameBlob) => {
    if (!enabled || available === false) return null;

    setDetecting(true);
    try {
      const formData = new FormData();
      formData.append('file', frameBlob, 'frame.jpg');

      const res = await fetch(`${YOLO_URL}/detect`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (data.detections?.length > 0) {
        const best = data.detections.reduce((a, b) =>
          a.confidence > b.confidence ? a : b
        );
        setLastDetection(best);
        return best;
      }
      return null;
    } catch {
      return null;
    } finally {
      setDetecting(false);
    }
  }, [enabled, available]);

  const clearDetection = useCallback(() => {
    setLastDetection(null);
  }, []);

  return { detecting, lastDetection, available, checkAvailability, detect, clearDetection };
}
