const express = require('express');
const { body } = require('express-validator');
const { login, refresh, logout, revokeTokens } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  login
);

router.get('/refresh', refresh);
router.post('/logout', logout);
router.post('/revoke', protect, revokeTokens);

module.exports = router;
