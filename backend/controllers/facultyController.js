const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// @desc    Get all faculty members
// @route   GET /api/faculty
const getFaculties = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        department: true,
        subjects: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: faculties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single faculty member
// @route   GET /api/faculty/:id
const getFaculty = async (req, res) => {
  try {
    let whereClause = {};
    if (req.params.id === 'me') {
      whereClause = { userId: req.user.id };
    } else {
      whereClause = { id: parseInt(req.params.id) };
    }

    const faculty = await prisma.faculty.findUnique({
      where: whereClause,
      include: {
        department: true,
        subjects: {
          include: {
            semester: {
              include: { course: true }
            }
          }
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (req.user.role === 'FACULTY' && faculty.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
    }

    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Create faculty
// @route   POST /api/faculty
const createFaculty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { departmentId, dob, email, subjectIds, ...rest } = req.body;
    let profileImage = null;

    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
    }

    const defaultPassword = rest.facultyId.toLowerCase();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const result = await prisma.$transaction(async (prismaClient) => {
      const user = await prismaClient.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'FACULTY',
        },
      });

      let parsedSubjectIds = [];
      if (subjectIds) {
        parsedSubjectIds = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
      }
      const subjectsConnect = parsedSubjectIds.map(id => ({ id: parseInt(id) }));

      const faculty = await prismaClient.faculty.create({
        data: {
          ...rest,
          departmentId: parseInt(departmentId),
          dob: new Date(dob),
          profileImage,
          userId: user.id,
          subjects: { connect: subjectsConnect }
        },
        include: { department: true, subjects: true },
      });

      return faculty;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Faculty ID or Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update faculty
// @route   PUT /api/faculty/:id
const updateFaculty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { departmentId, dob, subjectIds, email, ...rest } = req.body;
    let updateData = { ...rest };

    if (departmentId) updateData.departmentId = parseInt(departmentId);
    if (dob) updateData.dob = new Date(dob);

    if (subjectIds) {
      const parsedSubjectIds = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
      updateData.subjects = {
        set: parsedSubjectIds.map(id => ({ id: parseInt(id) }))
      };
    } else {
      // If subjectIds is explicitly undefined/empty in some cases, maybe clear it, but here we only update if provided.
      // However, if we want to clear subjects, formData would either not send subjectIds or send it empty.
      // FormData doesn't append empty arrays easily. If it's empty, we might need to clear it.
      // For now, if subjectIds is undefined, we assume it means "clear all" since the frontend always appends the keys if it exists, but if it's empty it might not append anything.
      // Wait, in frontend we append nothing if subjectIds is empty. So it will be undefined.
      // We should explicitly set subjects to empty if subjectIds is not provided.
      updateData.subjects = { set: [] };
    }

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const faculty = await prisma.faculty.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { department: true, subjects: true },
    });

    res.json({ success: true, data: faculty });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Faculty ID already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Delete faculty
// @route   DELETE /api/faculty/:id
const deleteFaculty = async (req, res) => {
  try {
    await prisma.faculty.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true, message: 'Faculty removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};
