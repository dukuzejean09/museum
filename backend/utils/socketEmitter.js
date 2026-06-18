import { emitEvent, emitToEntity } from '../socket.js';

/**
 * Centralized socket event emitter for all CRUD operations.
 * Controllers call these helpers after successful operations.
 */

// ── Generic CRUD emitters ──

function emitCreated(entityType, data, rooms = ['public', 'admin']) {
  emitEvent(`${entityType}:created`, { entityType, data }, { rooms });
}

function emitUpdated(entityType, data, rooms = ['public', 'admin']) {
  emitEvent(`${entityType}:updated`, { entityType, data }, { rooms });
  if (data._id) {
    emitToEntity(entityType, data._id, `${entityType}:updated`, { data });
  }
}

function emitDeleted(entityType, id, rooms = ['public', 'admin']) {
  emitEvent(`${entityType}:deleted`, { entityType, id }, { rooms });
  emitToEntity(entityType, id, `${entityType}:deleted`, { id });
}

// ── Content entities (public + admin) ──

export const exhibition = {
  created: (data) => emitCreated('exhibition', data),
  updated: (data) => emitUpdated('exhibition', data),
  deleted: (id) => emitDeleted('exhibition', id),
};

export const artifact = {
  created: (data) => emitCreated('artifact', data),
  updated: (data) => emitUpdated('artifact', data),
  deleted: (id) => emitDeleted('artifact', id),
};

export const story = {
  created: (data) => emitCreated('story', data),
  updated: (data) => emitUpdated('story', data),
  deleted: (id) => emitDeleted('story', id),
};

export const trail = {
  created: (data) => emitCreated('trail', data),
  updated: (data) => emitUpdated('trail', data),
  deleted: (id) => emitDeleted('trail', id),
};

export const guide = {
  created: (data) => emitCreated('guide', data),
  updated: (data) => emitUpdated('guide', data),
  deleted: (id) => emitDeleted('guide', id),
};

// ── Admin-only entities ──

export const booking = {
  created: (data) => emitCreated('booking', data, ['admin', 'staff']),
  updated: (data) => emitUpdated('booking', data, ['admin', 'staff']),
  deleted: (id) => emitDeleted('booking', id, ['admin', 'staff']),
};

export const message = {
  created: (data) => emitCreated('message', data, ['admin', 'staff']),
  updated: (data) => emitUpdated('message', data, ['admin', 'staff']),
  deleted: (id) => emitDeleted('message', id, ['admin', 'staff']),
  replied: (data) => emitEvent('message:replied', { data }, { rooms: ['admin', 'staff'] }),
};

export const survey = {
  created: (data) => emitCreated('survey', data, ['admin']),
  deleted: (id) => emitDeleted('survey', id, ['admin']),
};

export const evaluation = {
  created: (data) => emitCreated('evaluation', data, ['admin']),
  deleted: (id) => emitDeleted('evaluation', id, ['admin']),
};

export const user = {
  created: (data) => emitEvent('user:created', { data: sanitizeUser(data) }, { rooms: ['admin'] }),
  updated: (data) => emitEvent('user:updated', { data: sanitizeUser(data) }, { rooms: ['admin'] }),
  deleted: (id) => emitEvent('user:deleted', { id }, { rooms: ['admin'] }),
  statusChanged: (data) => emitEvent('user:statusChanged', { data: sanitizeUser(data) }, { rooms: ['admin'] }),
};

export const accessCode = {
  created: (data) => emitEvent('accessCode:created', { data }, { rooms: ['admin', 'staff'] }),
  deactivated: (data) => emitEvent('accessCode:deactivated', { data }, { rooms: ['admin', 'staff'] }),
  used: (data) => emitEvent('accessCode:used', { data }, { rooms: ['admin', 'staff'] }),
};

// ── Analytics / dashboard ──

export const analytics = {
  eventTracked: (data) => emitEvent('analytics:event', { data }, { rooms: ['admin'] }),
  dashboardUpdate: (data) => emitEvent('analytics:dashboard', { data }, { rooms: ['admin'] }),
};

// ── Notifications ──

export const notification = {
  toAdmin: (data) => emitEvent('notification', { data }, { rooms: ['admin'] }),
  toStaff: (data) => emitEvent('notification', { data }, { rooms: ['staff'] }),
  toAll: (data) => emitEvent('notification', { data }, { rooms: ['public'] }),
};

// ── Helper ──

function sanitizeUser(data) {
  if (!data) return data;
  const obj = data.toObject ? data.toObject() : { ...data };
  delete obj.password;
  return obj;
}
