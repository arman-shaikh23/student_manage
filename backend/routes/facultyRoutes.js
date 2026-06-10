const express = require('express');
const { body } = require('express-validator');
const upload = require('../middleware/uploadMiddleware');
const {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all faculty routes

router
  .route('/')
  .get(authorize('ADMIN', 'FACULTY', 'STUDENT'), getFaculties)
  .post(
    authorize('ADMIN'),
    upload.single('profileImage'),
    [
      body('facultyId').notEmpty().withMessage('Faculty ID is required'),
      body('firstName').notEmpty().withMessage('First Name is required'),
      body('lastName').notEmpty().withMessage('Last Name is required'),
      body('email').isEmail().withMessage('Valid Email is required'),
      body('phone').matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),
      body('departmentId').isNumeric().withMessage('Department ID is required'),
    ],
    createFaculty
  );

router
  .route('/:id')
  .get(authorize('ADMIN', 'FACULTY'), getFaculty)
  .put(
    authorize('ADMIN', 'FACULTY'),
    upload.single('profileImage'),
    [
      body('email').optional().isEmail().withMessage('Valid Email is required'),
      body('phone').optional().matches(/^\d{10}$/).withMessage('Phone must be exactly 10 digits'),
    ],
    updateFaculty
  )
  .delete(authorize('ADMIN'), deleteFaculty);

module.exports = router;
