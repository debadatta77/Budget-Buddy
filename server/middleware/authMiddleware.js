import { verifyToken } from '../services/authService.js';

/**
 * Authentication Middleware
 * Enforces JWT Bearer token authentication and scopes user isolation.
 */
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Bearer token is missing from authorization header'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, name, ... }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Token verification failed or session expired',
      error: err.message
    });
  }
};

export const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch {
      // Invalid/expired token: continue as guest
    }
  }
  next();
};

export const adminProtect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization required: Bearer token is missing'
    });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Administrative privileges required'
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Admin token verification failed or expired',
      error: err.message
    });
  }
};

export default protect;
