/**
 * QR Detection Web Worker
 *
 * Receives ImageData from the main thread, runs jsQR detection,
 * and posts back any QR code found.
 */
import jsQR from 'jsqr';

self.onmessage = (e) => {
  const { imageData, width, height } = e.data;

  try {
    const code = jsQR(imageData, width, height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      // Try to parse as JSON payload first
      let parsed = null;
      try {
        parsed = JSON.parse(code.data);
      } catch {
        // Not JSON — try URL parsing
        try {
          const url = new URL(code.data);
          const type = url.searchParams.get('type');
          const id = url.searchParams.get('id');
          if (type && id) {
            parsed = { t: type, id };
          }
        } catch {
          // Not a URL either
        }
      }

      self.postMessage({
        found: true,
        data: code.data,
        parsed: parsed ? { type: parsed.t || parsed.type, id: parsed.id } : null,
        location: {
          topLeft: code.location.topLeftCorner,
          topRight: code.location.topRightCorner,
          bottomLeft: code.location.bottomLeftCorner,
          bottomRight: code.location.bottomRightCorner,
        },
      });
    } else {
      self.postMessage({ found: false });
    }
  } catch (err) {
    self.postMessage({ found: false, error: err.message });
  }
};
