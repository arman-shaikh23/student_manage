const express = require('express');
const { body } = require('express-validator');
const { getFees, addPayment } = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All fee routes require auth

router.get('/', authorize('ADMIN', 'STUDENT'), getFees);

router.post(
  '/:feeId/payments',
  authorize('ADMIN'), // Only admins can add payments
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paymentMode').notEmpty().withMessage('Payment mode is required'),
  ],
  addPayment
);

module.exports = router;
