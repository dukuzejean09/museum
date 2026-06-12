/**
 * Role-based authorization middleware.
 * Must be used AFTER protect middleware (which sets req.admin).
 *
 * Usage:
 *   requireRole('admin')              — admin only
 *   requireRole('admin', 'guide')     — both admin and guide
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!roles.includes(req.admin.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

export default requireRole;
