import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Route files
import { publicRouter as trailPublic, adminRouter as trailAdmin } from './routes/trailRoutes.js';
import { publicRouter as guidePublic, adminRouter as guideAdmin, guideRouter as guideSelf } from './routes/guideRoutes.js';
import { publicRouter as messagePublic, adminRouter as messageAdmin } from './routes/messageRoutes.js';
import { publicRouter as bookingPublic, adminRouter as bookingAdmin } from './routes/bookingRoutes.js';
import { publicRouter as surveyPublic, adminRouter as surveyAdmin } from './routes/surveyRoutes.js';
import { publicRouter as exhibitionPublic, adminRouter as exhibitionAdmin } from './routes/exhibitionRoutes.js';
import { publicRouter as artifactPublic, adminRouter as artifactAdmin } from './routes/artifactRoutes.js';
import { publicRouter as storyPublic, adminRouter as storyAdmin } from './routes/storyRoutes.js';
import { publicRouter as searchPublic } from './routes/searchRoutes.js';
import { adminRouter as analyticsAdmin, publicRouter as analyticsPublic } from './routes/adminAnalyticsRoutes.js';

// Standalone routes
import authRoutes from './routes/authRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import visitorAuthRoutes from './routes/visitorAuthRoutes.js';
import { publicRouter as arPublic, adminRouter as arAdmin } from './routes/arRoutes.js';
import yoloProxyRoutes from './routes/yoloProxyRoutes.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — restrict to frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost',
].filter(Boolean).map(u => u.replace(/\/+$/, '')); // remove trailing slashes

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'AI request limit reached, please try again later' },
});

const arLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'AR scan limit reached, please try again later' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/visitor/validate', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api/ai/identify-visitor', arLimiter);

// YOLO proxy must be mounted BEFORE body parsers so raw multipart is forwarded intact
app.use('/api/yolo', yoloProxyRoutes);

app.use(express.json({ limit: '10mb' }));

// Sanitize input — prevent NoSQL injection ($-prefixed keys) and XSS
const sanitize = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // strip NoSQL operators
      clean[key] = sanitize(val);
    }
    return clean;
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────────
// Visitor auth routes (public — validate code to get token)
app.use('/api/visitor', visitorAuthRoutes);

// Auth routes (admin login — no visitor auth required)
app.use('/api/auth', authRoutes);

// Messages — no visitor auth (contact form accessible without token)
app.use('/api/messages', messagePublic);

// ──────────────────────────────────────────────
// Public API routes (read-only, no auth required)
app.use('/api/exhibitions', exhibitionPublic);
app.use('/api/artifacts', artifactPublic);
app.use('/api/stories', storyPublic);
app.use('/api/trails', trailPublic);
app.use('/api/guides', guidePublic);
app.use('/api/bookings', bookingPublic);
app.use('/api/surveys', surveyPublic);
app.use('/api/search', searchPublic);
app.use('/api/analytics', analyticsPublic);
app.use('/api/ar', arPublic);

// ──────────────────────────────────────────────
// Admin API routes (protected by auth middleware in each route file)
app.use('/api/admin/exhibitions', exhibitionAdmin);
app.use('/api/admin/artifacts', artifactAdmin);
app.use('/api/admin/stories', storyAdmin);
app.use('/api/admin/trails', trailAdmin);
app.use('/api/admin/guides', guideAdmin);
app.use('/api/guide', guideSelf);
app.use('/api/admin/messages', messageAdmin);
app.use('/api/admin/bookings', bookingAdmin);
app.use('/api/admin/surveys', surveyAdmin);
app.use('/api/admin/analytics', analyticsAdmin);
app.use('/api/qr', qrRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin/ar', arAdmin);

// ──────────────────────────────────────────────
// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) {
    console.error('Unhandled error:', err.stack);
  }

  res.status(statusCode).json({ message });
});

// Graceful shutdown
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
