/**
 * Recognition Pipeline Orchestrator Web Worker
 *
 * Coordinates the recognition hierarchy:
 * 1. QR Detection (handled by qr.worker.js, results passed in)
 * 2. OpenCV Feature Matching (handled by opencv.worker.js, results passed in)
 * 3. YOLO Detection (calls YOLO microservice)
 * 4. GPT-4o Fallback (signals main thread to use API)
 *
 * This worker receives pre-processed results from QR and OpenCV workers
 * and decides whether to escalate to YOLO or GPT-4o.
 */

let yoloServiceUrl = null;
let confidenceThreshold = 0.5;

self.onmessage = async (e) => {
  const { type, ...data } = e.data;

  switch (type) {
    case 'config':
      yoloServiceUrl = data.yoloServiceUrl || null;
      confidenceThreshold = data.confidenceThreshold || 0.5;
      self.postMessage({ type: 'configured' });
      break;

    case 'evaluate': {
      // Receives results from QR and OpenCV, decides next step
      const { qrResult, opencvResult, frameBlob } = data;

      // Phase 1: QR found — immediate resolution
      if (qrResult?.found && qrResult.parsed) {
        self.postMessage({
          type: 'resolved',
          method: 'qr',
          entityType: qrResult.parsed.type,
          entityId: qrResult.parsed.id,
          confidence: 1.0,
        });
        return;
      }

      // Phase 2: OpenCV matched with sufficient confidence
      if (opencvResult?.match && opencvResult.match.confidence >= confidenceThreshold) {
        self.postMessage({
          type: 'resolved',
          method: 'opencv',
          entityType: opencvResult.match.entityType,
          entityId: opencvResult.match.entityId,
          confidence: opencvResult.match.confidence,
        });
        return;
      }

      // Phase 3: Try YOLO if service is available
      if (yoloServiceUrl && frameBlob) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([frameBlob], { type: 'image/jpeg' }), 'frame.jpg');

          const response = await fetch(`${yoloServiceUrl}/detect`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.detections?.length > 0) {
              const best = result.detections.reduce((a, b) =>
                a.confidence > b.confidence ? a : b
              );
              if (best.confidence >= confidenceThreshold) {
                self.postMessage({
                  type: 'resolved',
                  method: 'yolo',
                  entityType: 'artifact',
                  entityId: best.class_name,
                  confidence: best.confidence,
                  bbox: best.bbox,
                });
                return;
              }
            }
          }
        } catch {
          // YOLO service unavailable — fall through to GPT-4o
        }
      }

      // Phase 4: Signal main thread to use GPT-4o fallback
      self.postMessage({
        type: 'fallback_needed',
        reason: 'No match from QR, OpenCV, or YOLO',
      });
      break;
    }

    default:
      break;
  }
};
