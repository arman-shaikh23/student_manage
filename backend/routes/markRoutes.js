const express = require('express');
const { body } = require('express-validator');
const { getMarks, addMarks } = require('../controllers/markController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all mark routes

router
  .route('/')
  .get(authorize('FACULTY', 'STUDENT'), getMarks)
  .post(
    authorize('FACULTY'),
    [
      body('studentId').notEmpty().withMessage('Student ID is required'),
      body('subjectId').notEmpty().withMessage('Subject ID is required'),
      body('internalMarks').optional().isNumeric().withMessage('Internal Marks must be a number'),
      body('externalMarks').optional().isNumeric().withMessage('External Marks must be a number'),
      body('totalMarks').isNumeric().withMessage('Total Marks must be a number'),
      body('examDate').isISO8601().withMessage('Valid Exam Date is required'),
    ],
    addMarks
  );

module.exports = router;
