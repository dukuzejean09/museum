import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * Middleware that requires either a valid visitor token OR an admin token.
 * - Visitor tokens have { type: 'visitor', codeId } in their payload.
 * - Admin tokens have { id } in their payload (set by authController).
 * Both are signed with the same JWT_SECRET.
 */
const visitorProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Access denied. Please scan a QR code to enter.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Admin token — has decoded.id (set by authController)
    if (decoded.id) {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.admin = admin;
        return next();
      }
    }

    // Visitor token — has decoded.type === 'visitor'
    if (decoded.type === 'visitor') {
      req.visitor = { codeId: decoded.codeId };
      return next();
    }

    return res.status(401).json({ message: 'Invalid token type' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access expired. Please scan the QR code again.' });
    }
    return res.status(401).json({ message: 'Access denied. Please scan a QR code to enter.' });
  }
};

export default visitorProtect;
