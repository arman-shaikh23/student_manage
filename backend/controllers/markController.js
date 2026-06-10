const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// @desc    Get marks records
// @route   GET /api/marks
const getMarks = async (req, res) => {
  try {
    const { studentId, subjectId } = req.query;
    const where = {};

    // Role-based restrictions
    if (req.user.role === 'STUDENT') {
      const studentRecord = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!studentRecord) return res.status(404).json({ success: false, message: 'Student profile not found' });
      where.studentId = studentRecord.id;
    } else if (studentId) {
      where.studentId = parseInt(studentId);
    }

    if (subjectId) where.subjectId = parseInt(subjectId);

    const marks = await prisma.marks.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        subject: { select: { name: true, subjectCode: true } },
      },
      orderBy: { examDate: 'desc' },
    });

    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Add or update marks
// @route   POST /api/marks
const addMarks = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { studentId, subjectId, internalMarks, externalMarks, totalMarks, examDate } = req.body;

    const parsedInternal = internalMarks ? parseFloat(internalMarks) : 0;
    const parsedExternal = externalMarks ? parseFloat(externalMarks) : 0;
    const parsedTotal = parseFloat(totalMarks);

    if (parsedInternal + parsedExternal > parsedTotal) {
      return res.status(400).json({ success: false, message: 'Marks exceed total marks' });
    }
    if (parsedInternal < 0 || parsedExternal < 0 || parsedTotal < 0) {
      return res.status(400).json({ success: false, message: 'Marks cannot be negative' });
    }

    // Faculty Assignment Check
    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user.id },
        include: { subjects: true },
      });
      if (!faculty) {
        return res.status(404).json({ success: false, message: 'Faculty profile not found' });
      }
      const isAssigned = faculty.subjects.some(sub => sub.id === parseInt(subjectId));
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only manage marks for your assigned subjects.' });
      }
    }

    const marksRecord = await prisma.marks.upsert({
      where: {
        studentId_subjectId_examDate: {
          studentId: parseInt(studentId),
          subjectId: parseInt(subjectId),
          examDate: new Date(examDate),
        },
      },
      update: {
        internalMarks: parsedInternal,
        externalMarks: parsedExternal,
        totalMarks: parsedTotal,
      },
      create: {
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
        internalMarks: parsedInternal,
        externalMarks: parsedExternal,
        totalMarks: parsedTotal,
        examDate: new Date(examDate),
      },
      include: { student: true, subject: true },
    });

    res.status(200).json({ success: true, message: 'Marks saved successfully', data: marksRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getMarks, addMarks };
