const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// @desc    Get dashboard analytics
// @route   GET /api/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalCourses = await prisma.course.count();
    const totalAttendance = await prisma.attendance.count();
    
    const allMarks = await prisma.marks.findMany({
      select: { internalMarks: true, externalMarks: true, totalMarks: true },
    });
    
    let averageMarks = 0;
    if (allMarks.length > 0) {
      const sum = allMarks.reduce((acc, curr) => {
        const totalScored = (curr.internalMarks || 0) + (curr.externalMarks || 0);
        return acc + (totalScored / curr.totalMarks) * 100;
      }, 0);
      averageMarks = sum / allMarks.length;
    }

    // Chart Data: Students added by month
    const students = await prisma.student.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const studentGrowth = students.reduce((acc, student) => {
      const month = student.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = acc.find((item) => item.name === month);
      if (existing) existing.students += 1;
      else acc.push({ name: month, students: 1 });
      return acc;
    }, []);

    // Course Enrollment Distribution
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    const courseEnrollment = courses
      .filter((course) => course._count.students > 0)
      .map((course) => ({
        name: course.courseName,
        value: course._count.students,
      }));

    // Recent 7 days attendance trend
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
      select: { date: true, status: true },
    });

    const attendanceTrendMap = {};
    recentAttendance.forEach((att) => {
      const dateStr = att.date.toISOString().split('T')[0];
      if (!attendanceTrendMap[dateStr]) attendanceTrendMap[dateStr] = { Present: 0, Absent: 0, Leave: 0 };
      attendanceTrendMap[dateStr][att.status] += 1;
    });

    const attendanceTrend = Object.keys(attendanceTrendMap).map((date) => ({
      date,
      ...attendanceTrendMap[date],
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        cards: {
          totalStudents,
          totalCourses,
          totalAttendanceRecords: totalAttendance,
          averageMarks: averageMarks.toFixed(2) + '%',
        },
        charts: {
          studentGrowth,
          courseEnrollment,
          attendanceTrend,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardAnalytics };
