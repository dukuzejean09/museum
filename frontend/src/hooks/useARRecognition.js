import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchExhibitionById, fetchArtifactById, fetchARDescriptors, aiIdentifyVisitor, aiNarrateStream, trackEvent } from '../api';
import useOpenCV from './useOpenCV';
import useYOLO from './useYOLO';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Master AR recognition hook — orchestrates the real-time recognition pipeline:
 *
 * 1. OpenCV feature matching  — runs every 500ms, instant client-side match
 * 2. YOLO object detection    — runs every 3s, detects objects + bounding boxes
 * 3. GPT-4o Vision            — auto-triggered when YOLO detects something,
 *                                or manually via "Identify" button
 *
 * All three methods run continuously while the camera is active.
 * When any method identifies an entity, the overlay is shown.
 */
export default function useARRecognition({ videoRef, canvasRef, enabled = true }) {
  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [performanceLevel, setPerformanceLevel] = useState(3);

  // YOLO detection state (for bounding box overlay)
  const [yoloDetection, setYoloDetection] = useState(null);

  const fpsRef = useRef([]);
  const lastEntityIdRef = useRef(null);
  const identifyingRef = useRef(false); // track async state without stale closures
  const yoloIntervalRef = useRef(null);

  // Sub-hooks
  const opencv = useOpenCV({ enabled: enabled && performanceLevel >= 1 });
  const yolo = useYOLO({ enabled: enabled && performanceLevel >= 2 });

  // Load descriptors on mount
  useEffect(() => {
    if (!enabled) return;
    fetchARDescriptors()
      .then(res => {
        const descriptors = res.data?.descriptors || res.data || [];
        if (descriptors.length > 0) {
          opencv.updateDescriptors(descriptors);
        }
      })
      .catch(() => {});
  }, [enabled]);

  // Check YOLO availability on mount
  useEffect(() => {
    if (enabled && performanceLevel >= 2) {
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

  /* ═══════════════════════════════════════════════
     Capture a video frame as a JPEG Blob
  ═══════════════════════════════════════════════ */
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return null;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, w, h);
    return { ctx, w, h };
  }, [videoRef, canvasRef]);

  /* ═══════════════════════════════════════════════
     Resolve entity from ID (shared by all methods)
  ═══════════════════════════════════════════════ */
  const resolveEntity = useCallback(async (type, id, recognitionMethod) => {
    if (id === lastEntityIdRef.current) return;
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

      autoNarrate(type, id, data);
    } catch {
      setError('Failed to load content');
      lastEntityIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ═══════════════════════════════════════════════
     Auto-narrate — priority: uploaded audio > pre-generated > on-demand TTS
  ═══════════════════════════════════════════════ */
  const autoNarrate = useCallback(async (type, id, entityData) => {
    try {
      const lang = navigator.language?.startsWith('fr') ? 'fr' : navigator.language?.startsWith('rw') ? 'rw' : 'en';
      const uploadedAudio = entityData?.narration?.full?.[lang] || entityData?.narration?.full?.en;
      if (uploadedAudio) {
        setAudioUrl(uploadedAudio.startsWith('http') ? uploadedAudio : `${API_BASE}${uploadedAudio}`);
        return;
      }
      if (entityData?.narrationAudioUrl) {
        const url = entityData.narrationAudioUrl.startsWith('http')
          ? entityData.narrationAudioUrl
          : `${API_BASE}${entityData.narrationAudioUrl}`;
        setAudioUrl(url);
        return;
      }
      const payload = type === 'artifact' ? { artifactId: id } : { exhibitionId: id };
      const blobUrl = await aiNarrateStream(payload);
      // '__browser_tts__' means the browser is speaking it directly — no audio URL needed
      if (blobUrl && blobUrl !== '__browser_tts__') {
        setAudioUrl(blobUrl);
      }
    } catch {
      // Narration is optional
    }
  }, []);

  /* ═══════════════════════════════════════════════
     GPT-4o identification (sends frame to backend)
  ═══════════════════════════════════════════════ */
  const runGPT4oIdentification = useCallback(async (blob) => {
    if (identifyingRef.current) return; // prevent overlapping calls
    identifyingRef.current = true;
    setIdentifying(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', blob, `frame-${Date.now()}.jpg`);

      const { data } = await aiIdentifyVisitor(formData);

      if (data.matched && data.entityId) {
        setEntity(data.entity);
        setEntityType(data.entityType);
        setMethod('gpt4o');
        lastEntityIdRef.current = data.entityId;

        trackEvent({
          eventType: 'ar_recognition_success',
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: {
            source: 'ar',
            recognitionMethod: 'gpt4o',
            recognitionConfidence: data.confidence === 'high' ? 0.9 : data.confidence === 'medium' ? 0.7 : 0.4,
          },
        }).catch(() => {});

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
      identifyingRef.current = false;
    }
  }, [autoNarrate]);

  /* ═══════════════════════════════════════════════
     Manual "Identify" button — captures frame and sends to GPT-4o
  ═══════════════════════════════════════════════ */
  const identifyWithAI = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;

    const blob = await new Promise(resolve =>
      canvasRef.current.toBlob(resolve, 'image/jpeg', 0.85)
    );
    if (!blob) return;

    await runGPT4oIdentification(blob);
  }, [captureFrame, canvasRef, runGPT4oIdentification]);

  /* ═══════════════════════════════════════════════
     1) OpenCV continuous matching — every 500ms
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (!enabled || !scanning || entity || !opencv.isReady || opencv.descriptorCount === 0 || performanceLevel < 1) return;

    const interval = setInterval(() => {
      const frame = captureFrame();
      if (!frame) return;
      const imageData = frame.ctx.getImageData(0, 0, frame.w, frame.h);
      opencv.matchFrame(imageData.data, frame.w, frame.h);
    }, 500);

    return () => clearInterval(interval);
  }, [enabled, entity, scanning, opencv.isReady, opencv.descriptorCount, performanceLevel, captureFrame]);

  // React to OpenCV match results
  useEffect(() => {
    if (opencv.lastMatch && !entity && !loading) {
      resolveEntity(opencv.lastMatch.entityType, opencv.lastMatch.entityId, 'opencv');
      opencv.clearMatch();
    }
  }, [opencv.lastMatch, entity, loading, resolveEntity]);

  /* ═══════════════════════════════════════════════
     2) YOLO continuous detection — every 3s
     When YOLO detects an object, show bounding box
     and auto-trigger GPT-4o to identify the entity
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (!enabled || !scanning || entity || performanceLevel < 2 || yolo.available === false) {
      clearInterval(yoloIntervalRef.current);
      return;
    }

    // Wait until YOLO health check completes
    if (yolo.available === null) return;

    const runYOLO = async () => {
      // Skip if already identifying or entity already found
      if (identifyingRef.current || entity || !scanning) return;

      const frame = captureFrame();
      if (!frame) return;

      const blob = await new Promise(resolve =>
        canvasRef.current.toBlob(resolve, 'image/jpeg', 0.80)
      );
      if (!blob) return;

      const detection = await yolo.detect(blob);
      if (detection && detection.confidence >= 0.5) {
        setYoloDetection(detection);

        // YOLO detected something — auto-trigger GPT-4o to identify the exact entity
        // Re-capture a fresh, higher quality frame for GPT-4o
        const freshFrame = captureFrame();
        if (freshFrame) {
          const hqBlob = await new Promise(resolve =>
            canvasRef.current.toBlob(resolve, 'image/jpeg', 0.90)
          );
          if (hqBlob) {
            await runGPT4oIdentification(hqBlob);
          }
        }
      } else {
        setYoloDetection(null);
      }
    };

    yoloIntervalRef.current = setInterval(runYOLO, 3000);
    // Also run immediately on first tick
    runYOLO();

    return () => clearInterval(yoloIntervalRef.current);
  }, [enabled, scanning, entity, performanceLevel, yolo.available, captureFrame, canvasRef, runGPT4oIdentification]);

  /* ═══════════════════════════════════════════════
     3) Auto-GPT-4o fallback — if no OpenCV descriptors
     and no YOLO available, periodically try GPT-4o
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    // Only auto-scan with GPT-4o if no other methods are working
    const noOpenCV = !opencv.isReady || opencv.descriptorCount === 0;
    const noYOLO = yolo.available === false;
    if (!enabled || !scanning || entity || !noOpenCV || !noYOLO) return;

    // Auto-GPT-4o every 5 seconds as a last resort
    const interval = setInterval(async () => {
      if (identifyingRef.current || entity) return;

      const frame = captureFrame();
      if (!frame) return;

      const blob = await new Promise(resolve =>
        canvasRef.current.toBlob(resolve, 'image/jpeg', 0.85)
      );
      if (blob) {
        await runGPT4oIdentification(blob);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled, scanning, entity, opencv.isReady, opencv.descriptorCount, yolo.available, captureFrame, canvasRef, runGPT4oIdentification]);

  /* ═══════════════════════════════════════════════
     Dismiss overlay — reset state, resume scanning
  ═══════════════════════════════════════════════ */
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
    setYoloDetection(null);
    lastEntityIdRef.current = null;
  }, [entity, entityType, method]);

  const start = useCallback(() => setScanning(true), []);
  const stop = useCallback(() => setScanning(false), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(yoloIntervalRef.current);
    };
  }, []);

  return {
    entity,
    entityType,
    method,
    loading,
    identifying,
    audioUrl,
    error,
    performanceLevel,
    scanning,
    opencvReady: opencv.isReady,
    yoloDetection,
    start,
    stop,
    dismiss,
    identifyWithAI,
    trackFPS,
  };
}
