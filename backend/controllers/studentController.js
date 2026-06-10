const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// @desc    Get all students
// @route   GET /api/students
const getStudents = async (req, res) => {
  try {
    const { search, courseId, semesterId, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (courseId) where.courseId = parseInt(courseId);
    if (semesterId) where.semesterId = parseInt(semesterId);
    if (status) where.status = status;

    const students = await prisma.student.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        course: { select: { courseName: true, courseCode: true } },
        semester: { select: { name: true } },
        fees: { select: { totalFee: true, paidFee: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.student.count({ where });

    res.json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
const getStudent = async (req, res) => {
  try {
    let whereClause = {};
    if (req.params.id === 'me') {
      whereClause = { userId: req.user.id };
    } else {
      whereClause = { id: parseInt(req.params.id) };
    }

    const student = await prisma.student.findUnique({
      where: whereClause,
      include: {
        course: true,
        semester: { include: { subjects: true } },
        fees: true,
        attendances: {
          include: { subject: true },
          orderBy: { date: 'desc' },
          take: 10,
        },
        marks: {
          include: { subject: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role check: If STUDENT, ensure they are requesting their own ID
    if (req.user.role === 'STUDENT' && student.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create student
// @route   POST /api/students
const createStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { courseId, semesterId, dob, admissionDate, email, ...rest } = req.body;
    let profileImage = null;

    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
    }

    // 1. Generate default password for User (Student ID in lowercase)
    const defaultPassword = rest.studentId.toLowerCase();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Get course to create Fee
    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) return res.status(400).json({ success: false, message: 'Invalid Course' });

    // Use a transaction to create User, Student, and Fee atomicity
    const result = await prisma.$transaction(async (prismaClient) => {
      // Create User
      const user = await prismaClient.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'STUDENT',
        },
      });

      // Create Student
      const student = await prismaClient.student.create({
        data: {
          ...rest,
          courseId: parseInt(courseId),
          semesterId: parseInt(semesterId),
          dob: new Date(dob),
          admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
          profileImage,
          userId: user.id,
        },
        include: { course: true, semester: true },
      });

      // Create Fee
      await prismaClient.fee.create({
        data: {
          studentId: student.id,
          totalFee: course.fee,
          paidFee: 0,
          status: 'Pending',
        },
      });

      return student;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Student ID or Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
const updateStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { courseId, semesterId, dob, admissionDate, email, ...rest } = req.body;
    let updateData = { ...rest };

    if (courseId) updateData.courseId = parseInt(courseId);
    if (semesterId) updateData.semesterId = parseInt(semesterId);
    if (dob) updateData.dob = new Date(dob);
    if (admissionDate) updateData.admissionDate = new Date(admissionDate);

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // Check ownership before updating
    const existingStudent = await prisma.student.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existingStudent) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.role === 'STUDENT') {
      if (existingStudent.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only edit your own profile.' });
      }
      // Students cannot change their course, semester, dob, or admissionDate
      delete updateData.courseId;
      delete updateData.semesterId;
      delete updateData.dob;
      delete updateData.admissionDate;
      delete updateData.studentId;
      delete updateData.status;
    }

    const student = await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { course: true, semester: true },
    });

    res.json({ success: true, data: student });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Student ID or Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Since onDelete Cascade is used, we only need to delete the User account if it exists,
    // which cascades down to Student, Fee, etc. (Wait, User cascades to Student but Student cascading to User isn't automatic from Student side if User is parent).
    // Actually, Student userId points to User id. So deleting User deletes Student.
    if (student.userId) {
      await prisma.user.delete({ where: { id: student.userId } });
    } else {
      await prisma.student.delete({ where: { id: parseInt(req.params.id) } });
    }

    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
};
