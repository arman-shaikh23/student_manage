import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdAssessment, MdDownload } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import { exportToPDF } from '../utils/exportPDF';
import { AuthContext } from '../context/AuthContext';

const calculateGrade = (obtained, total) => {
  const percentage = (obtained / total) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const getGradeColor = (grade) => {
  switch (grade) {
    case 'A+': case 'A': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'B+': case 'B': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'C': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'D': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    default: return 'bg-red-500/10 text-red-500 border-red-500/20';
  }
};

const StudentMarksView = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyMarks = async () => {
      try {
        const res = await api.get('/marks');
        if (res.data.success) {
          setMarks(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to load your marks');
      } finally {
        setLoading(false);
      }
    };
    fetchMyMarks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Marks</h1>
          <p className="text-muted-foreground text-sm mt-1">View your academic performance across subjects.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card animate-pulse rounded-xl"></div>)}
        </div>
      ) : marks.length === 0 ? (
        <div className="glass bg-card rounded-2xl p-12 text-center border border-border">
          <MdAssessment size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No Marks Available</h3>
          <p className="text-muted-foreground text-sm mt-1">Your marks will appear here once published by faculty.</p>
        </div>
      ) : (
        <div className="glass bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-left text-sm text-muted-foreground relative">
              <thead className="bg-muted/50 text-xs uppercase text-foreground sticky top-0 z-10 shadow-sm backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Subject</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Internal + External</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Percentage</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {marks.map((mark) => {
                  const totalScored = (mark.internalMarks || 0) + (mark.externalMarks || 0);
                  const percentage = ((totalScored / mark.totalMarks) * 100).toFixed(1);
                  const grade = calculateGrade(totalScored, mark.totalMarks);

                  return (
                    <motion.tr 
                      key={mark.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">{mark.subject?.name}</td>
                      <td className="px-6 py-4">{new Date(mark.examDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">
                        <span className="text-blue-500">{mark.internalMarks || 0}</span> + <span className="text-orange-500">{mark.externalMarks || 0}</span> = {totalScored} <span className="text-muted-foreground font-normal">/ {mark.totalMarks}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-xs font-medium">{percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const Marks = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMark, setEditingMark] = useState(null);

  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    internalMarks: '',
    externalMarks: '',
    totalMarks: '100',
    examDate: new Date().toISOString().split('T')[0],
  });

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

  const fetchData = async () => {
    if (!selectedSemester || !selectedSubject) {
      setMarks([]);
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const [marksRes, studentsRes] = await Promise.all([
        api.get(`/marks?subjectId=${selectedSubject}`),
        api.get(`/students?semesterId=${selectedSemester}&limit=1000`)
      ]);
      if (marksRes.data.success) setMarks(marksRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSemester, selectedSubject]);

  const openAddModal = () => {
    if (!selectedSubject) {
      toast.error('Please select a subject first');
      return;
    }
    setEditingMark(null);
    setFormData({ 
      studentId: students[0]?.id || '', 
      subjectId: selectedSubject, 
      internalMarks: '', 
      externalMarks: '', 
      totalMarks: '100', 
      examDate: new Date().toISOString().split('T')[0] 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (mark) => {
    setEditingMark(mark);
    setFormData({
      studentId: mark.studentId,
      subjectId: mark.subjectId,
      internalMarks: mark.internalMarks || '',
      externalMarks: mark.externalMarks || '',
      totalMarks: mark.totalMarks,
      examDate: new Date(mark.examDate).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const internal = parseFloat(formData.internalMarks || 0);
    const external = parseFloat(formData.externalMarks || 0);
    const total = parseFloat(formData.totalMarks);

    if(internal + external > total) {
      toast.error('Sum of Internal and External marks cannot exceed Total Marks');
      return;
    }

    try {
      const res = await api.post('/marks', { ...formData, internalMarks: internal, externalMarks: external });

      if (res.data.success) {
        toast.success(`Marks ${editingMark ? 'updated' : 'added'} successfully`);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleExportPDF = () => {
    const dataToExport = marks.map(m => {
      const totalScored = (m.internalMarks || 0) + (m.externalMarks || 0);
      const percentage = ((totalScored / m.totalMarks) * 100).toFixed(2);
      return {
        studentId: m.student?.studentId,
        name: `${m.student?.firstName} ${m.student?.lastName}`,
        subject: m.subject?.name,
        marks: `${totalScored}/${m.totalMarks}`,
        percentage: `${percentage}%`,
        grade: calculateGrade(totalScored, m.totalMarks),
        examDate: new Date(m.examDate).toLocaleDateString()
      };
    });

    const columns = [
      { header: 'Student ID', accessor: 'studentId' },
      { header: 'Name', accessor: 'name' },
      { header: 'Subject', accessor: 'subject' },
      { header: 'Marks', accessor: 'marks' },
      { header: 'Percentage', accessor: 'percentage' },
      { header: 'Grade', accessor: 'grade' },
      { header: 'Date', accessor: 'examDate' },
    ];
    
    exportToPDF(dataToExport, columns, 'Academic Marks Report', 'marks_report');
  };

  if (user?.role === 'STUDENT') {
    return <StudentMarksView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marks & Grading</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage exam scores and generate academic reports.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            disabled={marks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border disabled:opacity-50"
          >
            <MdDownload size={20} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            <MdAdd size={20} />
            Add Marks
          </button>
        </div>
      </div>

      <div className="glass bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <div className="glass bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Student</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Subject & Date</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Int + Ext = Total</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Percentage</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Grade</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : !selectedSubject ? (
                 <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    <MdAssessment size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium text-foreground">Select a Subject</p>
                    <p className="text-sm text-muted-foreground mt-1">Choose a course, semester, and subject to view marks.</p>
                  </td>
                </tr>
              ) : marks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    <p className="text-lg font-medium text-foreground">No marks found</p>
                    <p className="text-sm text-muted-foreground mt-1">Start by adding marks for students.</p>
                  </td>
                </tr>
              ) : (
                marks.map((mark) => {
                  const totalScored = (mark.internalMarks || 0) + (mark.externalMarks || 0);
                  const percentage = ((totalScored / mark.totalMarks) * 100).toFixed(1);
                  const grade = calculateGrade(totalScored, mark.totalMarks);
                  
                  return (
                    <motion.tr 
                      key={mark.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{mark.student?.firstName} {mark.student?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{mark.student?.studentId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{mark.subject?.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(mark.examDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <span className="text-blue-500">{mark.internalMarks || 0}</span> + <span className="text-orange-500">{mark.externalMarks || 0}</span> = {totalScored} <span className="text-muted-foreground font-normal">/ {mark.totalMarks}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-xs font-medium">{percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(mark)}
                            className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit"
                          >
                            <MdEdit size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card glass w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden border border-border">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h2 className="text-xl font-bold text-foreground">{editingMark ? 'Edit Marks' : 'Add Marks'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><MdClose size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {!editingMark && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Student</label>
                    <select required name="studentId" value={formData.studentId} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary">
                      <option value="" disabled>Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1 text-blue-500">Internal Marks</label>
                    <input required type="number" step="0.01" name="internalMarks" value={formData.internalMarks} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1 text-orange-500">External Marks</label>
                    <input required type="number" step="0.01" name="externalMarks" value={formData.externalMarks} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Total Marks</label>
                    <input required type="number" step="0.01" name="totalMarks" value={formData.totalMarks} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Exam Date</label>
                  <input required type="date" name="examDate" value={formData.examDate} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 mt-4 rounded-lg border border-border text-foreground hover:bg-muted font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 mt-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">{editingMark ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marks;
