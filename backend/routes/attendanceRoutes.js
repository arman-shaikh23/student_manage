const express = require('express');
const { body } = require('express-validator');
const { getAttendance, markAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all attendance routes

router
  .route('/')
  .get(authorize('FACULTY', 'STUDENT'), getAttendance)
  .post(
    authorize('FACULTY'),
    [
      body('records').isArray().withMessage('Records must be an array'),
      body('records.*.studentId').notEmpty().withMessage('Student ID is required'),
      body('records.*.subjectId').notEmpty().withMessage('Subject ID is required'),
      body('records.*.date').isISO8601().withMessage('Valid date is required'),
      body('records.*.status').isIn(['Present', 'Absent', 'Leave']).withMessage('Invalid status'),
    ],
    markAttendance
  );

module.exports = router;
