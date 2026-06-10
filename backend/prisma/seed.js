const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles & Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 2. Create Departments
  const departmentsData = [
    { name: 'Computer Science & IT' },
    { name: 'Engineering' },
    { name: 'Medical & Healthcare' },
    { name: 'Management & Commerce' },
    { name: 'Arts & Humanities' },
  ];

  const deps = {};
  for (const dep of departmentsData) {
    const d = await prisma.department.upsert({
      where: { departmentName: dep.name },
      update: {},
      create: { departmentName: dep.name },
    });
    deps[dep.name] = d.id;
  }

  // 3. Courses Data (20+ Industry Courses)
  const coursesData = [
    // CS & IT
    { name: 'B.Tech Computer Engineering', code: 'BTECH-CE', dur: '4 Years', fee: 120000, dep: deps['Computer Science & IT'] },
    { name: 'BCA (Bachelor of Computer Applications)', code: 'BCA', dur: '3 Years', fee: 80000, dep: deps['Computer Science & IT'] },
    { name: 'MCA (Master of Computer Applications)', code: 'MCA', dur: '2 Years', fee: 110000, dep: deps['Computer Science & IT'] },
    { name: 'B.Sc Computer Science', code: 'BSC-CS', dur: '3 Years', fee: 60000, dep: deps['Computer Science & IT'] },
    // Engineering
    { name: 'B.Tech Electrical Engineering', code: 'BTECH-EE', dur: '4 Years', fee: 115000, dep: deps['Engineering'] },
    { name: 'B.Tech Mechanical Engineering', code: 'BTECH-ME', dur: '4 Years', fee: 115000, dep: deps['Engineering'] },
    { name: 'B.Tech Civil Engineering', code: 'BTECH-CIV', dur: '4 Years', fee: 110000, dep: deps['Engineering'] },
    { name: 'B.Tech Chemical Engineering', code: 'BTECH-CHEM', dur: '4 Years', fee: 110000, dep: deps['Engineering'] },
    { name: 'B.Tech Electronics & Comm.', code: 'BTECH-ECE', dur: '4 Years', fee: 120000, dep: deps['Engineering'] },
    // Medical & Healthcare
    { name: 'B.Sc Nursing', code: 'NURSING', dur: '4 Years', fee: 90000, dep: deps['Medical & Healthcare'] },
    { name: 'Bachelor of Physiotherapy (BPT)', code: 'BPT', dur: '4.5 Years', fee: 100000, dep: deps['Medical & Healthcare'] },
    { name: 'B.Pharmacy', code: 'BPHARM', dur: '4 Years', fee: 105000, dep: deps['Medical & Healthcare'] },
    { name: 'MBBS', code: 'MBBS', dur: '5.5 Years', fee: 500000, dep: deps['Medical & Healthcare'] },
    { name: 'BDS', code: 'BDS', dur: '5 Years', fee: 400000, dep: deps['Medical & Healthcare'] },
    // Management & Commerce
    { name: 'MBA', code: 'MBA', dur: '2 Years', fee: 250000, dep: deps['Management & Commerce'] },
    { name: 'BBA', code: 'BBA', dur: '3 Years', fee: 90000, dep: deps['Management & Commerce'] },
    { name: 'B.Com', code: 'BCOM', dur: '3 Years', fee: 50000, dep: deps['Management & Commerce'] },
    { name: 'M.Com', code: 'MCOM', dur: '2 Years', fee: 70000, dep: deps['Management & Commerce'] },
    // Arts & Humanities
    { name: 'BA English Literature', code: 'BA-ENG', dur: '3 Years', fee: 40000, dep: deps['Arts & Humanities'] },
    { name: 'BA Psychology', code: 'BA-PSY', dur: '3 Years', fee: 45000, dep: deps['Arts & Humanities'] },
    { name: 'MA History', code: 'MA-HIST', dur: '2 Years', fee: 50000, dep: deps['Arts & Humanities'] },
  ];

  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: { courseCode: c.code },
      update: {},
      create: {
        courseName: c.name,
        courseCode: c.code,
        duration: c.dur,
        fee: c.fee,
        departmentId: c.dep,
      },
    });

    // Generate Semesters based on duration
    const years = parseFloat(c.dur.split(' ')[0]);
    const numSemesters = years * 2; // Assuming 2 semesters per year

    for (let i = 1; i <= numSemesters; i++) {
      const semName = `Semester ${i}`;
      const semester = await prisma.semester.create({
        data: {
          name: semName,
          courseId: course.id,
        },
      });

      // Generate 5 subjects per semester
      const subjectsToCreate = [];
      for (let j = 1; j <= 5; j++) {
        subjectsToCreate.push({
          name: `${c.code} Subject ${i}-${j}`,
          subjectCode: `${c.code}-${i}0${j}`,
          credits: 3,
          semesterId: semester.id,
        });
      }

      await prisma.subject.createMany({ data: subjectsToCreate });
    }
  }

  // Specifically seed exact B.Tech CE subjects as requested
  const btechCE = await prisma.course.findUnique({ where: { courseCode: 'BTECH-CE' } });
  if (btechCE) {
    // Overwrite Semester 1-7 with precise subjects
    const ceSemesters = await prisma.semester.findMany({ where: { courseId: btechCE.id }, orderBy: { name: 'asc' } });
    
    const preciseSubjects = {
      'Semester 1': ['Engineering Mathematics', 'Physics', 'Basic Electrical', 'C Programming', 'Communication Skills'],
      'Semester 2': ['Data Structures', 'OOP using C++', 'Digital Logic', 'Mathematics 2'],
      'Semester 3': ['Java', 'DBMS', 'DSA', 'Operating System'],
      'Semester 4': ['Web Development', 'Computer Networks', 'Software Engineering'],
      'Semester 5': ['AI', 'Machine Learning', 'Cloud Computing'],
      'Semester 6': ['Full Stack Development', 'Cyber Security'],
      'Semester 7': ['Project', 'Internship'],
      'Semester 8': ['Major Project']
    };

    for (const sem of ceSemesters) {
      if (preciseSubjects[sem.name]) {
        // Delete autogenerated ones for this sem
        await prisma.subject.deleteMany({ where: { semesterId: sem.id } });
        
        const subData = preciseSubjects[sem.name].map((sName, idx) => ({
          name: sName,
          subjectCode: `CE-${sem.name.split(' ')[1]}0${idx+1}`,
          credits: sName.includes('Project') ? 6 : 3,
          semesterId: sem.id,
        }));
        await prisma.subject.createMany({ data: subData });
      }
    }
  }

  console.log('Database seeded with 20+ courses, dynamic semesters, and subjects!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
