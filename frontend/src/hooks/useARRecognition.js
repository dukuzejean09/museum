import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchExhibitionById, fetchArtifactById, fetchARDescriptors, aiIdentifyVisitor, aiNarrate, trackEvent } from '../api';
import useQRScanner from './useQRScanner';
import useOpenCV from './useOpenCV';
import useYOLO from './useYOLO';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Master AR recognition hook — orchestrates the full pipeline:
 * QR -> OpenCV -> YOLO -> GPT-4o
 *
 * Implements graceful degradation for low-end devices.
 */
export default function useARRecognition({ videoRef, canvasRef, enabled = true }) {
  const [entity, setEntity] = useState(null);         // Resolved entity data
  const [entityType, setEntityType] = useState(null);  // 'exhibition' | 'artifact'
  const [method, setMethod] = useState(null);          // 'qr' | 'opencv' | 'yolo' | 'gpt4o'
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [performanceLevel, setPerformanceLevel] = useState(3); // 3=full, 2=no yolo, 1=qr only, 0=manual

  const fpsRef = useRef([]);
  const lastEntityIdRef = useRef(null);

  // Sub-hooks
  const qr = useQRScanner({ videoRef, canvasRef, enabled, scanInterval: 250 });
  const opencv = useOpenCV({ enabled: enabled && performanceLevel >= 2 });
  const yolo = useYOLO({ enabled: enabled && performanceLevel >= 3 });

  // Load descriptors on mount
  useEffect(() => {
    if (!enabled) return;
    fetchARDescriptors()
      .then(res => {
        const descriptors = res.data?.descriptors || [];
        if (descriptors.length > 0) {
          opencv.updateDescriptors(descriptors);
        }
      })
      .catch(() => {}); // Descriptors are optional
  }, [enabled]);

  // Check YOLO availability on mount
  useEffect(() => {
    if (enabled && performanceLevel >= 3) {
      yolo.checkAvailability();
    }
  }, [enabled, performanceLevel]);

  // FPS monitoring for adaptive degradation
  const trackFPS = useCallback((fps) => {
    fpsRef.current.push(fps);
    if (fpsRef.current.length > 30) fpsRef.current.shift();

    const avg = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;

    if (avg < 10 && performanceLevel > 0) {
      setPerformanceLevel(prev => Math.max(0, prev - 1));
    } else if (avg > 25 && performanceLevel < 3) {
      setPerformanceLevel(prev => Math.min(3, prev + 1));
    }
  }, [performanceLevel]);

  // Fetch entity data by type and ID
  const resolveEntity = useCallback(async (type, id, recognitionMethod) => {
    if (id === lastEntityIdRef.current) return; // Don't re-fetch same entity
    lastEntityIdRef.current = id;

    setLoading(true);
    setError(null);
    try {
      let data;
      if (type === 'artifact') {
        const res = await fetchArtifactById(id);
        data = res.data?.data || res.data;
      } else {
        const res = await fetchExhibitionById(id);
        data = res.data?.data || res.data;
      }

      setEntity(data);
      setEntityType(type);
      setMethod(recognitionMethod);

      // Track analytics
      trackEvent({
        eventType: 'ar_scan',
        entityType: type,
        entityId: id,
        metadata: {
          source: 'ar',
          recognitionMethod,
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        },
      }).catch(() => {});

      // Auto-narrate
      autoNarrate(type, id, data);
    } catch (err) {
      setError('Failed to load content');
      lastEntityIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-generate narration
  const autoNarrate = useCallback(async (type, id, entityData) => {
    try {
      const payload = type === 'artifact' ? { artifactId: id } : { exhibitionId: id };
      const { data } = await aiNarrate(payload);
      const url = data.audioUrl?.startsWith('http') ? data.audioUrl : `${API_BASE}${data.audioUrl}`;
      setAudioUrl(url);
    } catch {
      // Narration is optional — don't block the AR experience
    }
  }, []);

  // React to QR scan results
  useEffect(() => {
    if (qr.lastResult?.parsed && !loading) {
      const { type, id } = qr.lastResult.parsed;
      if (type && id) {
        resolveEntity(type, id, 'qr');
        qr.clearResult();
      }
    }
  }, [qr.lastResult, loading, resolveEntity]);

  // Periodic OpenCV matching (runs every ~500ms when no entity is shown)
  useEffect(() => {
    if (!enabled || entity || !opencv.isReady || opencv.descriptorCount === 0 || performanceLevel < 2) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) return;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      opencv.matchFrame(imageData.data, w, h);
    }, 500);

    return () => clearInterval(interval);
  }, [enabled, entity, opencv.isReady, opencv.descriptorCount, performanceLevel, videoRef, canvasRef]);

  // React to OpenCV match results
  useEffect(() => {
    if (opencv.lastMatch && !entity && !loading) {
      resolveEntity(opencv.lastMatch.entityType, opencv.lastMatch.entityId, 'opencv');
      opencv.clearMatch();
    }
  }, [opencv.lastMatch, entity, loading, resolveEntity]);

  // Manual GPT-4o identify (user taps "Identify" button)
  const identifyWithAI = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );

    if (!blob) return;

    setIdentifying(true);
    setError(null);

    // Try YOLO first if available
    if (performanceLevel >= 3 && yolo.available) {
      const detection = await yolo.detect(blob);
      if (detection && detection.confidence >= 0.5) {
        // YOLO matched — try to resolve
        setIdentifying(false);
        // Note: YOLO returns class names, not entity IDs
        // For custom-trained models, class_name maps to entity ID
        // For now, fall through to GPT-4o
      }
    }

    // GPT-4o fallback
    try {
      const formData = new FormData();
      formData.append('image', blob, `frame-${Date.now()}.jpg`);

      const { data } = await aiIdentifyVisitor(formData);

      if (data.matched && data.entityId) {
        setEntity(data.entity);
        setEntityType(data.entityType);
        setMethod('gpt4o');
        lastEntityIdRef.current = data.entityId;

        // Track analytics
        trackEvent({
          eventType: 'ar_recognition_success',
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: { source: 'ar', recognitionMethod: 'gpt4o', recognitionConfidence: data.confidence === 'high' ? 0.9 : data.confidence === 'medium' ? 0.7 : 0.4 },
        }).catch(() => {});

        // Narrate
        autoNarrate(data.entityType, data.entityId, data.entity);
      } else {
        setError(data.description || 'Could not identify this object');
        trackEvent({
          eventType: 'ar_recognition_failure',
          entityType: 'artifact',
          entityId: '000000000000000000000000',
          metadata: { source: 'ar', recognitionMethod: 'gpt4o' },
        }).catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identification failed');
    } finally {
      setIdentifying(false);
    }
  }, [videoRef, canvasRef, performanceLevel, yolo, autoNarrate]);

  // Dismiss overlay
  const dismiss = useCallback(() => {
    if (entity && entityType) {
      trackEvent({
        eventType: 'ar_dismiss',
        entityType,
        entityId: lastEntityIdRef.current || entity._id,
        metadata: { source: 'ar', recognitionMethod: method },
      }).catch(() => {});
    }
    setEntity(null);
    setEntityType(null);
    setMethod(null);
    setAudioUrl(null);
    setError(null);
    lastEntityIdRef.current = null;
  }, [entity, entityType, method]);

  // Start/stop scanning
  const start = useCallback(() => {
    qr.startScanning();
  }, [qr]);

  const stop = useCallback(() => {
    qr.stopScanning();
  }, [qr]);

  return {
    entity,
    entityType,
    method,
    loading,
    identifying,
    audioUrl,
    error,
    performanceLevel,
    scanning: qr.scanning,
    opencvReady: opencv.isReady,
    start,
    stop,
    dismiss,
    identifyWithAI,
    trackFPS,
  };
}
