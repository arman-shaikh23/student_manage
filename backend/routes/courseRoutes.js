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

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Retrieve a list of courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of courses
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseName:
 *                 type: string
 *               courseCode:
 *                 type: string
 *               duration:
 *                 type: string
 *               instructor:
 *                 type: string
 *               fee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Course created successfully
 */

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course details
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course updated successfully
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course deleted successfully
 */

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
