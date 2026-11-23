import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'maaza_super_secret_cafe_jwt_key_2026_secure');

      // Attempt to attach user if DB is connected
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        } else {
          req.user = { id: decoded.id, username: decoded.username || 'admin', role: 'admin' };
        }
      } catch {
        req.user = { id: decoded.id, username: decoded.username || 'admin', role: 'admin' };
      }

      return next();
    } catch (error) {
      console.error('JWT Authentication Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};
