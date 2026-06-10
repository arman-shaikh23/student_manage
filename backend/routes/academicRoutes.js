const express = require('express');
const { getDepartments, getCourses, getSemestersByCourse, getSubjectsBySemester } = require('../controllers/academicController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All academic metadata needs auth

router.get('/departments', getDepartments);
router.get('/courses', getCourses);
router.get('/courses/:courseId/semesters', getSemestersByCourse);
router.get('/semesters/:semesterId/subjects', getSubjectsBySemester);

module.exports = router;
