const express = require('express');
const { body, custom } = require('express-validator');
const upload = require('../middleware/uploadMiddleware');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management endpoints
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Retrieve a list of students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of students
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               courseId:
 *                 type: integer
 *               semesterId:
 *                 type: integer
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Student created successfully
 */

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
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
 *         description: Student data
 *   put:
 *     summary: Update a student
 *     tags: [Students]
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
 *         description: Student updated successfully
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
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
 *         description: Student deleted successfully
 */
router.use(protect); // Protect all student routes

const dobValidator = (value) => {
  const dob = new Date(value);
  const now = new Date();
  if (dob >= now) {
    throw new Error('DOB cannot be a future date');
  }
  const ageDifMs = now.getTime() - dob.getTime();
  const ageDate = new Date(ageDifMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  if (age < 15 || age > 80) {
    throw new Error('Age must be between 15 and 80 years');
  }
  return true;
};

router
  .route('/')
  .get(authorize('ADMIN', 'FACULTY'), getStudents)
  .post(
    authorize('ADMIN'),
    upload.single('profileImage'),
    [
      body('studentId')
        .matches(/^STU202\d{5}$/)
        .withMessage('Student ID must match format STU202XXXXX (e.g. STU20260001)'),
      body('firstName').notEmpty().withMessage('First Name is required'),
      body('lastName').notEmpty().withMessage('Last Name is required'),
      body('email').isEmail().withMessage('Valid Email is required'),
      body('phone')
        .matches(/^\d{10}$/)
        .withMessage('Phone must be exactly 10 digits'),
      body('gender').notEmpty().withMessage('Gender is required'),
      body('dob').isISO8601().withMessage('Valid DOB is required').custom(dobValidator),
      body('address').notEmpty().withMessage('Address is required'),
      body('city').notEmpty().withMessage('City is required'),
      body('state').notEmpty().withMessage('State is required'),
      body('courseId').isNumeric().withMessage('Valid Course ID is required'),
      body('semesterId').isNumeric().withMessage('Valid Semester ID is required'),
    ],
    createStudent
  );

router
  .route('/:id')
  .get(authorize('ADMIN', 'FACULTY', 'STUDENT'), getStudent)
  .put(
    authorize('ADMIN', 'STUDENT'),
    upload.single('profileImage'),
    [
      body('email').optional().isEmail().withMessage('Valid Email is required'),
      body('dob').optional().isISO8601().withMessage('Valid DOB is required').custom(dobValidator),
      body('phone').optional().matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),
      body('courseId').optional().isNumeric().withMessage('Valid Course ID is required'),
      body('semesterId').optional().isNumeric().withMessage('Valid Semester ID is required'),
    ],
    updateStudent
  )
  .delete(authorize('ADMIN'), deleteStudent);

module.exports = router;
