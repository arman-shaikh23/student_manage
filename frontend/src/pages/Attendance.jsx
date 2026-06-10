import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { MdCheckCircle, MdCancel, MdDownload, MdSave, MdEventAvailable } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import { exportToPDF } from '../utils/exportPDF';
import { AuthContext } from '../context/AuthContext';

const StudentAttendanceView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAttendance = async () => {
      try {
        const res = await api.get('/attendance');
        if (res.data.success) {
          setRecords(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to load your attendance');
      } finally {
        setLoading(false);
      }
    };
    fetchMyAttendance();
  }, []);

  const stats = {};
  records.forEach(r => {
    const sub = r.subject.name;
    if (!stats[sub]) stats[sub] = { present: 0, total: 0 };
    stats[sub].total += 1;
    if (r.status === 'Present') stats[sub].present += 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">View your subject-wise attendance performance.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card animate-pulse rounded-xl"></div>)}
        </div>
      ) : records.length === 0 ? (
        <div className="glass bg-card rounded-2xl p-12 text-center border border-border">
          <MdEventAvailable size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No Attendance Records Yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Your attendance records will appear here once marked by faculty.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(stats).map(([subject, data]) => {
              const percentage = Math.round((data.present / data.total) * 100) || 0;
              return (
                <div key={subject} className="glass bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-colors">
                  <h3 className="font-semibold text-foreground mb-4 truncate" title={subject}>{subject}</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold text-primary">{percentage}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{data.present} / {data.total} Classes Attended</p>
                    </div>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-4 ${percentage >= 75 ? 'bg-green-100 text-green-600 border-green-200' : percentage >= 60 ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-foreground">Recent Classes</h2>
            </div>
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left text-sm text-muted-foreground relative">
                <thead className="bg-muted/50 text-xs uppercase text-foreground sticky top-0 z-10 shadow-sm backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Subject</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{record.subject.name}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'Present' ? 'bg-green-100/50 text-green-700 dark:text-green-400' : record.status === 'Absent' ? 'bg-red-100/50 text-red-700 dark:text-red-400' : 'bg-orange-100/50 text-orange-700 dark:text-orange-400'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Attendance = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch Courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/academics/courses');
        if (res.data.success) setCourses(res.data.data);
      } catch (e) {}
    };
    fetchCourses();
  }, []);

  // Fetch Semesters when Course changes
  useEffect(() => {
    const fetchSemesters = async () => {
      if (!selectedCourse) { setSemesters([]); return; }
      try {
        const res = await api.get(`/academics/courses/${selectedCourse}/semesters`);
        if (res.data.success) {
          setSemesters(res.data.data);
          setSelectedSemester('');
          setSelectedSubject('');
        }
      } catch (e) {}
    };
    fetchSemesters();
  }, [selectedCourse]);

  // Fetch Subjects when Semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedSemester) { setSubjects([]); return; }
      try {
        const res = await api.get(`/academics/semesters/${selectedSemester}/subjects`);
        if (res.data.success) {
          setSubjects(res.data.data);
          setSelectedSubject('');
        }
      } catch (e) {}
    };
    fetchSubjects();
  }, [selectedSemester]);

  // Fetch Students & Attendance when Subject and Date are ready
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSemester || !selectedSubject || !date) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        // Fetch students in this semester
        const studentsRes = await api.get(`/students?semesterId=${selectedSemester}&limit=1000`);
        const studentsList = studentsRes.data.data;
        setStudents(studentsList);

        // Fetch attendance for this subject and date
        const attendanceRes = await api.get(`/attendance?subjectId=${selectedSubject}&date=${date}`);
        const existingRecords = attendanceRes.data.data;

        // Map existing data
        const newAttendanceData = {};
        studentsList.forEach(student => {
          const existing = existingRecords.find(r => r.studentId === student.id);
          newAttendanceData[student.id] = existing ? existing.status : 'Present'; // Default to Present
        });
        setAttendanceData(newAttendanceData);
      } catch (error) {
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedSemester, selectedSubject, date]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedSubject) return toast.error('Please select a subject first');
    try {
      const records = Object.keys(attendanceData).map(studentId => ({
        studentId: parseInt(studentId),
        subjectId: parseInt(selectedSubject),
        date: date,
        status: attendanceData[studentId]
      }));

      const res = await api.post('/attendance', { records });
      if (res.data.success) {
        toast.success('Attendance saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save attendance');
    }
  };

  const handleExportPDF = () => {
    if (!selectedSubject) return toast.error('Please select a subject');
    const subjectName = subjects.find(s => s.id === parseInt(selectedSubject))?.name || 'Subject';
    
    const dataToExport = students.map(student => ({
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      status: attendanceData[student.id] || 'N/A'
    }));

    const columns = [
      { header: 'Student ID', accessor: 'studentId' },
      { header: 'Name', accessor: 'name' },
      { header: 'Status', accessor: 'status' },
    ];
    
    exportToPDF(dataToExport, columns, `Attendance Report - ${subjectName} (${date})`, `attendance_${date}`);
  };

  if (user?.role === 'STUDENT') {
    return <StudentAttendanceView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Mark and track daily student attendance by subject.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            disabled={!selectedSubject || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border disabled:opacity-50"
          >
            <MdDownload size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={!selectedSubject || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm disabled:opacity-50"
          >
            <MdSave size={20} />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      <div className="glass bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary text-sm">
            <option value="" disabled>Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Semester</label>
          <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} disabled={!selectedCourse} className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-50">
            <option value="" disabled>Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedSemester} className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-50">
            <option value="" disabled>Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      </div>

      <div className="glass bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Student Info</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-muted rounded w-48"></div></td>
                    <td className="px-6 py-4 flex justify-end"><div className="h-8 bg-muted rounded w-48"></div></td>
                  </tr>
                ))
              ) : !selectedSubject ? (
                <tr>
                  <td colSpan="2" className="px-6 py-12 text-center text-muted-foreground">Please select a subject and date to load students.</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-6 py-12 text-center text-muted-foreground">No students found for this semester.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-muted-foreground">{student.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex rounded-lg border border-border p-1 bg-muted/20">
                        <button
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            attendanceData[student.id] === 'Present' 
                              ? 'bg-green-500 text-white shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-background'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            attendanceData[student.id] === 'Absent' 
                              ? 'bg-red-500 text-white shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-background'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Leave')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            attendanceData[student.id] === 'Leave' 
                              ? 'bg-orange-500 text-white shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-background'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
