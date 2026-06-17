import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * Regenerate the fingerprint from the current request to compare against
 * the fingerprint stored in the JWT. This prevents session hijacking —
 * even if an attacker steals the token, it won't work from a different
 * machine/browser (different User-Agent + IP).
 */
const generateFingerprint = (req) => {
  const ua = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection?.remoteAddress || '';
  return crypto.createHash('sha256').update(`${ua}|${ip}`).digest('hex').slice(0, 16);
};

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify fingerprint binding — defeats stolen token / session hijacking
    if (decoded.fp) {
      const currentFp = generateFingerprint(req);
      if (decoded.fp !== currentFp) {
        return res.status(401).json({ message: 'Session invalid. Please log in again.' });
      }
    }

    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default protect;
