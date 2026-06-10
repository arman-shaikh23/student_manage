const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    let whereClause = {};

    let studentRecord = null;
    if (req.user.role === 'STUDENT') {
      studentRecord = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (studentRecord) {
        whereClause.id = studentRecord.courseId;
      } else {
        whereClause.id = -1; // Prevent showing all courses if student record is missing
      }
    } else if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ 
        where: { userId: req.user.id },
        include: { subjects: { include: { semester: true } } }
      });
      if (faculty && faculty.subjects && faculty.subjects.length > 0) {
        const courseIds = faculty.subjects.map(s => s.semester.courseId);
        whereClause.id = { in: Array.from(new Set(courseIds)) };
      } else {
        whereClause.id = -1; // Prevent showing all courses if no subjects assigned
      }
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        department: { select: { departmentName: true } },
        semesters: {
          include: { subjects: true }
        },
        _count: {
          select: { students: true, semesters: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ 
        where: { userId: req.user.id },
        include: { subjects: true }
      });
      if (faculty && faculty.subjects) {
        const assignedSubjectIds = faculty.subjects.map(s => s.id);
        courses.forEach(course => {
          if (course.semesters) {
             course.semesters.forEach(sem => {
                 if (sem.subjects) {
                     sem.subjects = sem.subjects.filter(sub => assignedSubjectIds.includes(sub.id));
                 }
             });
             // Remove semesters that have no assigned subjects for this faculty
             course.semesters = course.semesters.filter(sem => sem.subjects && sem.subjects.length > 0);
          }
        });
      }
    }

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        students: true,
      },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private
const createCourse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const data = { ...req.body };
    if (data.fee) data.fee = parseFloat(data.fee);

    const course = await prisma.course.create({
      data: data,
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
const updateCourse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const data = { ...req.body };
    if (data.fee !== undefined) data.fee = parseFloat(data.fee);

    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: data,
    });
    res.json({ success: true, data: course });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
const deleteCourse = async (req, res) => {
  try {
    await prisma.course.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
