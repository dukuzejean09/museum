import express from 'express';
import { Buffer } from 'buffer';

const router = express.Router();

const YOLO_INTERNAL_URL = process.env.YOLO_URL || 'http://127.0.0.1:8001';

/**
 * Proxy requests to the internal YOLO microservice.
 * Frontend calls /api/yolo/health, /api/yolo/detect, etc.
 * Backend forwards them to the co-located Python service.
 */

// GET endpoints (health, models)
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${YOLO_INTERNAL_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(503).json({ status: 'unavailable', model_loaded: false });
  }
});

router.get('/models', async (req, res) => {
  try {
    const response = await fetch(`${YOLO_INTERNAL_URL}/models`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(503).json({ message: 'YOLO service unavailable' });
  }
});

// POST /detect — forward multipart form data
router.post('/detect', async (req, res) => {
  try {
    // Collect the raw body to forward
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const response = await fetch(`${YOLO_INTERNAL_URL}/detect`, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'],
      },
      body,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(503).json({ message: 'YOLO service unavailable' });
  }
});

// POST /classify — forward multipart form data
router.post('/classify', async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const response = await fetch(`${YOLO_INTERNAL_URL}/classify`, {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'],
      },
      body,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch {
    res.status(503).json({ message: 'YOLO service unavailable' });
  }
});

export default router;
