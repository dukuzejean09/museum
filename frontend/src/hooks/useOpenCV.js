import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Hook for OpenCV.js feature matching via Web Worker.
 * Loads OpenCV in a worker, caches descriptors, and matches camera frames.
 */
export default function useOpenCV({ enabled = true }) {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const [descriptorCount, setDescriptorCount] = useState(0);

  // Initialize worker
  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(
      new URL('../workers/opencv.worker.js', import.meta.url),
      { type: 'classic' } // classic for importScripts support
    );

    worker.onmessage = (e) => {
      switch (e.data.type) {
        case 'ready':
          setIsReady(true);
          break;
        case 'descriptors_loaded':
          setDescriptorCount(e.data.count);
          break;
        case 'match_result':
          setLastMatch(e.data.match);
          break;
        case 'error':
          console.warn('OpenCV worker error:', e.data.message);
          break;
      }
    };

    workerRef.current = worker;
    worker.postMessage({ type: 'init' });

    return () => {
      worker.terminate();
      workerRef.current = null;
      setIsReady(false);
    };
  }, [enabled]);

  // Update descriptors in worker
  const updateDescriptors = useCallback((descriptors) => {
    workerRef.current?.postMessage({
      type: 'update_descriptors',
      descriptors,
    });
  }, []);

  // Send frame for matching
  const matchFrame = useCallback((imageData, width, height) => {
    if (!isReady || !workerRef.current) return;
    workerRef.current.postMessage({
      type: 'match',
      imageData,
      width,
      height,
    });
  }, [isReady]);

  // Clear the last match
  const clearMatch = useCallback(() => {
    setLastMatch(null);
  }, []);

  return { isReady, lastMatch, descriptorCount, updateDescriptors, matchFrame, clearMatch };
}
