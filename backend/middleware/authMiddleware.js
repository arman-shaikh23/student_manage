const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { publicKey } = require('../utils/keys');

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

      // Get user from the token
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, tokenVersion: true }, // Include tokenVersion
      });

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Check if tokenVersion matches to prevent revoked tokens from working
      if (req.user.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({ success: false, message: 'Token Expired' }); // Special message to trigger frontend refresh
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token Expired' }); // Special message to trigger frontend refresh
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `User role ${req.user?.role} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
