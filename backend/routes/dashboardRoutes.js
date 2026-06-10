const express = require('express');
const { getDashboardAnalytics } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getDashboardAnalytics);

module.exports = router;
