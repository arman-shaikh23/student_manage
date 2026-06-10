const express = require('express');
const { body } = require('express-validator');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all course routes

router
  .route('/')
  .get(authorize('ADMIN', 'FACULTY', 'STUDENT'), getCourses)
  .post(
    authorize('ADMIN'),
    [
      body('courseName').notEmpty().withMessage('Course name is required'),
      body('courseCode').notEmpty().withMessage('Course code is required'),
      body('duration').notEmpty().withMessage('Duration is required'),
      body('instructor').notEmpty().withMessage('Instructor is required'),
      body('fee').isNumeric().withMessage('Fee must be a number').toFloat(),
    ],
    createCourse
  );

router
  .route('/:id')
  .get(authorize('ADMIN', 'FACULTY', 'STUDENT'), getCourse)
  .put(
    authorize('ADMIN'),
    [
      body('courseName').optional().notEmpty().withMessage('Course name cannot be empty'),
      body('courseCode').optional().notEmpty().withMessage('Course code cannot be empty'),
      body('fee').optional().isNumeric().withMessage('Fee must be a number').toFloat(),
    ],
    updateCourse
  )
  .delete(authorize('ADMIN'), deleteCourse);

module.exports = router;
