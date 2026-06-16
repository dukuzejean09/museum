import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Hook for continuous QR code scanning from a video element.
 * Uses a Web Worker to process frames off the main thread.
 */
export default function useQRScanner({ videoRef, canvasRef, enabled = true, scanInterval = 200 }) {
  const workerRef = useRef(null);
  const intervalRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Initialize worker
  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(
      new URL('../workers/qr.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      if (e.data.found) {
        setLastResult(e.data);
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled]);

  // Start scanning loop
  const startScanning = useCallback(() => {
    if (intervalRef.current || !enabled) return;
    setScanning(true);

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const worker = workerRef.current;

      if (!video || !canvas || !worker || video.readyState < 2) return;

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) return;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      worker.postMessage({
        imageData: imageData.data,
        width: w,
        height: h,
      });
    }, scanInterval);
  }, [videoRef, canvasRef, enabled, scanInterval]);

  // Stop scanning loop
  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setScanning(false);
  }, []);

  // Clear the last result
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { lastResult, scanning, startScanning, stopScanning, clearResult };
}
