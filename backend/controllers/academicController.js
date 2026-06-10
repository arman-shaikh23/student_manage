const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get all departments
// @route   GET /api/academics/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { departmentName: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all courses with basic info
// @route   GET /api/academics/courses
const getCourses = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user.id },
        include: { subjects: { include: { semester: true } } }
      });
      if (faculty && faculty.subjects) {
        const courseIds = faculty.subjects.map(s => s.semester.courseId);
        whereClause.id = { in: Array.from(new Set(courseIds)) };
      }
    } else if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (student) {
        whereClause.id = student.courseId;
      }
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: { id: true, courseName: true, courseCode: true, fee: true },
      orderBy: { courseName: 'asc' },
    });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get semesters for a specific course
// @route   GET /api/academics/courses/:courseId/semesters
const getSemestersByCourse = async (req, res) => {
  try {
    let whereClause = { courseId: parseInt(req.params.courseId) };
    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user.id },
        include: { subjects: true }
      });
      if (faculty && faculty.subjects) {
        const semesterIds = faculty.subjects.map(s => s.semesterId);
        whereClause.id = { in: Array.from(new Set(semesterIds)) };
      }
    } else if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (student) {
        whereClause.id = student.semesterId;
      }
    }

    const semesters = await prisma.semester.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get subjects for a specific semester
// @route   GET /api/academics/semesters/:semesterId/subjects
const getSubjectsBySemester = async (req, res) => {
  try {
    let whereClause = { semesterId: parseInt(req.params.semesterId) };
    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user.id },
        include: { subjects: true }
      });
      if (faculty && faculty.subjects) {
        const subjectIds = faculty.subjects.map(s => s.id);
        whereClause.id = { in: subjectIds };
      }
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDepartments, getCourses, getSemestersByCourse, getSubjectsBySemester };
