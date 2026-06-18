import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

let io = null;

/**
 * Initialize Socket.IO server with the HTTP server instance.
 * Handles authentication, rooms, heartbeat, and connection management.
 */
export function initSocket(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 10000,
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6, // 1MB max message size
  });

  // ── Authentication middleware ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const tokenType = socket.handshake.auth?.type || 'visitor'; // 'admin' | 'visitor'

    if (!token) {
      // Allow anonymous connections to public channel
      socket.role = 'anonymous';
      socket.userId = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (tokenType === 'admin' && decoded.id) {
        socket.role = decoded.role || 'admin';
        socket.userId = decoded.id;
      } else if (decoded.type === 'visitor') {
        socket.role = 'visitor';
        socket.userId = decoded.codeId || 'visitor-' + crypto.randomBytes(4).toString('hex');
      } else {
        socket.role = 'anonymous';
        socket.userId = null;
      }

      return next();
    } catch {
      // Invalid token — allow as anonymous
      socket.role = 'anonymous';
      socket.userId = null;
      return next();
    }
  });

  // ── Connection handler ──
  io.on('connection', (socket) => {
    // Join role-based rooms
    socket.join('public'); // Everyone joins public

    if (socket.role === 'admin') {
      socket.join('admin');
      socket.join('staff');
    } else if (socket.role === 'guide') {
      socket.join('guide');
      socket.join('staff');
    } else if (socket.role === 'visitor') {
      socket.join('visitors');
    }

    // Track connected users count
    broadcastUserCount();

    // ── Client can request to join specific entity rooms ──
    socket.on('join:entity', ({ type, id }) => {
      if (type && id) {
        socket.join(`${type}:${id}`);
      }
    });

    socket.on('leave:entity', ({ type, id }) => {
      if (type && id) {
        socket.leave(`${type}:${id}`);
      }
    });

    // ── Heartbeat acknowledgment ──
    socket.on('ping:client', () => {
      socket.emit('pong:server', { ts: Date.now() });
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      broadcastUserCount();
    });
  });

  return io;
}

/**
 * Broadcast current connected user count to admin room
 */
function broadcastUserCount() {
  if (!io) return;
  const count = io.engine?.clientsCount || 0;
  io.to('admin').emit('stats:connections', { count, timestamp: Date.now() });
}

/**
 * Get the Socket.IO instance. Returns null if not initialized.
 */
export function getIO() {
  return io;
}

/**
 * Emit an event to specific rooms/channels.
 * This is the main function controllers use to broadcast changes.
 *
 * @param {string} event - Event name (e.g., 'exhibition:created')
 * @param {object} data - Event payload
 * @param {object} options - { rooms: string[], exclude: string }
 */
export function emitEvent(event, data, options = {}) {
  if (!io) return;

  const { rooms = ['public'], exclude } = options;
  const payload = { ...data, _ts: Date.now() };

  for (const room of rooms) {
    if (exclude) {
      io.to(room).except(exclude).emit(event, payload);
    } else {
      io.to(room).emit(event, payload);
    }
  }
}

/**
 * Emit to a specific entity room (e.g., users viewing a specific exhibition)
 */
export function emitToEntity(entityType, entityId, event, data) {
  if (!io) return;
  io.to(`${entityType}:${entityId}`).emit(event, { ...data, _ts: Date.now() });
}

export default { initSocket, getIO, emitEvent, emitToEntity };
