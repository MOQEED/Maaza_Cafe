import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const generateToken = (id, username) => {
  return jwt.sign(
    { id, username },
    process.env.JWT_SECRET || 'maaza_super_secret_cafe_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// @desc Auth user & get token
// @route POST /api/login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password',
      });
    }

    const defaultAdminUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Try DB lookup
    let user = null;
    try {
      user = await User.findOne({ username });
    } catch {
      user = null;
    }

    if (user) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      const token = generateToken(user._id, user.username);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    }

    // 2. Fallback to default admin check
    if (username === defaultAdminUser && password === defaultAdminPass) {
      const token = generateToken('default-admin-id', defaultAdminUser);
      return res.json({
        success: true,
        token,
        user: {
          id: 'default-admin-id',
          username: defaultAdminUser,
          role: 'admin',
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc Get current user profile
// @route GET /api/me
export const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

// @desc Update admin login ID (username) and/or password
// @route PUT /api/admin/change-credentials
export const updateCredentials = async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to change credentials',
      });
    }

    const defaultAdminUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

    let user = null;
    try {
      if (req.user?.id && req.user.id !== 'default-admin-id') {
        user = await User.findById(req.user.id);
      }
      if (!user) {
        user = await User.findOne({ username: req.user?.username || defaultAdminUser });
      }
    } catch {
      user = null;
    }

    if (user) {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect current password',
        });
      }

      if (newUsername && newUsername.trim()) {
        const trimmedUser = newUsername.trim();
        const existing = await User.findOne({ username: trimmedUser, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `Username "${trimmedUser}" is already taken`,
          });
        }
        user.username = trimmedUser;
      }

      if (newPassword && newPassword.trim()) {
        if (newPassword.trim().length < 4) {
          return res.status(400).json({
            success: false,
            message: 'New password must be at least 4 characters long',
          });
        }
        user.password = newPassword.trim();
      }

      await user.save();

      const token = generateToken(user._id, user.username);
      return res.json({
        success: true,
        message: 'Credentials updated successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    }

    // Fallback if admin was not yet written to DB
    if (currentPassword === defaultAdminPass) {
      const updatedUsername = (newUsername && newUsername.trim()) || defaultAdminUser;
      try {
        const newUser = await User.create({
          username: updatedUsername,
          password: (newPassword && newPassword.trim()) || defaultAdminPass,
          role: 'admin',
        });
        const token = generateToken(newUser._id, newUser.username);
        return res.json({
          success: true,
          message: 'Credentials updated successfully',
          token,
          user: {
            id: newUser._id,
            username: newUser.username,
            role: newUser.role,
          },
        });
      } catch {
        const token = generateToken('default-admin-id', updatedUsername);
        return res.json({
          success: true,
          message: 'Credentials updated in current session',
          token,
          user: {
            id: 'default-admin-id',
            username: updatedUsername,
            role: 'admin',
          },
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Incorrect current password',
    });
  } catch (error) {
    console.error('updateCredentials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating credentials',
      error: error.message,
    });
  }
};

