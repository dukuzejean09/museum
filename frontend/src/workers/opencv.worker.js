/**
 * OpenCV Feature Matching Web Worker
 *
 * Loads OpenCV.js, extracts ORB features from camera frames,
 * and matches against pre-computed descriptors.
 */

let cv = null;
let descriptorDB = [];
let isReady = false;

// Load OpenCV.js
const loadOpenCV = async () => {
  if (cv) return;
  try {
    // OpenCV.js is loaded from CDN into the worker scope
    importScripts('https://docs.opencv.org/4.9.0/opencv.js');
    // OpenCV.js sets the cv global after the Module is ready
    await new Promise((resolve, reject) => {
      if (typeof cv !== 'undefined' && cv.Mat) {
        resolve();
        return;
      }
      // The opencv.js script sets Module.onRuntimeInitialized
      const checkReady = setInterval(() => {
        if (typeof cv !== 'undefined' && cv.Mat) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkReady);
        reject(new Error('OpenCV.js load timeout'));
      }, 30000);
    });
    isReady = true;
    self.postMessage({ type: 'ready' });
  } catch (err) {
    self.postMessage({ type: 'error', message: `OpenCV load failed: ${err.message}` });
  }
};

// Update the descriptor database
const updateDescriptors = (descriptors) => {
  descriptorDB = descriptors;
  self.postMessage({ type: 'descriptors_loaded', count: descriptors.length });
};

// Match a frame against stored descriptors
const matchFrame = (imageData, width, height) => {
  if (!isReady || !cv || descriptorDB.length === 0) {
    self.postMessage({ type: 'match_result', match: null });
    return;
  }

  let src = null;
  let gray = null;

  try {
    // Create Mat from ImageData
    src = cv.matFromImageData({ data: new Uint8ClampedArray(imageData), width, height });
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // ORB feature extraction
    const orb = new cv.ORB(500);
    const keypoints = new cv.KeyPointVector();
    const descriptors = new cv.Mat();
    orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

    if (descriptors.empty()) {
      self.postMessage({ type: 'match_result', match: null });
      keypoints.delete();
      descriptors.delete();
      orb.delete();
      return;
    }

    let bestMatch = null;
    let bestScore = 0;
    const MIN_GOOD_MATCHES = 10;
    const RATIO_THRESHOLD = 0.75;

    // BFMatcher with Hamming distance for ORB
    const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);

    for (const dbEntry of descriptorDB) {
      if (!dbEntry.descriptors || !dbEntry.descriptors.data) continue;

      try {
        // Reconstruct stored descriptors as a cv.Mat
        const storedDesc = cv.matFromArray(
          dbEntry.descriptors.rows,
          dbEntry.descriptors.cols,
          cv.CV_8U,
          dbEntry.descriptors.data
        );

        // KNN matching
        const matches = new cv.DMatchVectorVector();
        bf.knnMatch(descriptors, storedDesc, matches, 2);

        // Apply Lowe's ratio test
        let goodMatches = 0;
        for (let i = 0; i < matches.size(); i++) {
          const matchPair = matches.get(i);
          if (matchPair.size() >= 2) {
            const m = matchPair.get(0);
            const n = matchPair.get(1);
            if (m.distance < RATIO_THRESHOLD * n.distance) {
              goodMatches++;
            }
          }
        }

        const score = goodMatches / Math.max(descriptors.rows, 1);

        if (goodMatches >= MIN_GOOD_MATCHES && score > bestScore) {
          bestScore = score;
          bestMatch = {
            entityType: dbEntry.entityType,
            entityId: dbEntry.entityId,
            confidence: Math.min(score, 1.0),
            goodMatches,
          };
        }

        storedDesc.delete();
        matches.delete();
      } catch {
        // Skip this descriptor if matching fails
      }
    }

    bf.delete();
    keypoints.delete();
    descriptors.delete();
    orb.delete();

    self.postMessage({ type: 'match_result', match: bestMatch });
  } catch (err) {
    self.postMessage({ type: 'match_result', match: null, error: err.message });
  } finally {
    if (src) src.delete();
    if (gray) gray.delete();
  }
};

self.onmessage = (e) => {
  const { type, ...data } = e.data;

  switch (type) {
    case 'init':
      loadOpenCV();
      break;
    case 'update_descriptors':
      updateDescriptors(data.descriptors || []);
      break;
    case 'match':
      matchFrame(data.imageData, data.width, data.height);
      break;
    default:
      break;
  }
};
