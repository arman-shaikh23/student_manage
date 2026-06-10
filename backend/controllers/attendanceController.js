const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// @desc    Get attendance records
// @route   GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { date, studentId, subjectId, status } = req.query;
    const where = {};

    // Role-based restrictions
    if (req.user.role === 'STUDENT') {
      const studentRecord = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!studentRecord) return res.status(404).json({ success: false, message: 'Student profile not found' });
      where.studentId = studentRecord.id;
    } else if (studentId) {
      where.studentId = parseInt(studentId);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (subjectId) where.subjectId = parseInt(subjectId);
    if (status) where.status = status;

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, studentId: true } },
        subject: { select: { name: true, subjectCode: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Mark attendance (single or bulk)
// @route   POST /api/attendance
const markAttendance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { records } = req.body; // Array of { studentId, subjectId, date, status }

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Please provide an array of records' });
    }

    const operations = records.map((record) => {
      const recordDate = new Date(record.date);
      return prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: record.studentId,
            subjectId: record.subjectId,
            date: recordDate,
          },
        },
        update: { status: record.status },
        create: {
          studentId: record.studentId,
          subjectId: record.subjectId,
          date: recordDate,
          status: record.status,
        },
      });
    });

    const results = await prisma.$transaction(operations);

    res.status(200).json({ success: true, message: 'Attendance marked successfully', count: results.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getAttendance, markAttendance };
