const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { validationResult } = require('express-validator');
const { publicKey } = require('../utils/keys');

const prisma = new PrismaClient();

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, role } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Enforce Role Match
      if (role && user.role !== role) {
        return res.status(403).json({ success: false, message: `Access denied. Not authorized as ${role}` });
      }
      const accessToken = generateAccessToken(user.id, user.tokenVersion);
      const refreshToken = generateRefreshToken(user.id, user.tokenVersion);

      // Set Refresh Token in HttpOnly Cookie
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          accessToken,
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Refresh access token
// @route   GET /api/auth/refresh
// @access  Public (via Cookie)
const refresh = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(refreshToken, publicKey, { algorithms: ['RS256'] });
    
    // Check if user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check tokenVersion for revocation
    if (user.tokenVersion !== decoded.tokenVersion) {
      res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
      return res.status(401).json({ success: false, message: 'Token revoked' });
    }

    // Issue new access token
    const accessToken = generateAccessToken(user.id, user.tokenVersion);
    
    res.json({ success: true, accessToken, role: user.role, email: user.email, id: user.id });
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Forbidden or Token Expired' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Revoke all tokens (Change Password)
// @route   POST /api/auth/revoke
// @access  Private
const revokeTokens = async (req, res) => {
  try {
    // Increment tokenVersion to invalidate all existing refresh tokens
    await prisma.user.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } },
    });
    
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ success: true, message: 'All active sessions revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  revokeTokens,
};
