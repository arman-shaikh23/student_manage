import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdClose, MdBook } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Courses = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    departmentId: '',
    fee: '',
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/academics/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({ courseName: '', courseCode: '', departmentId: departments[0]?.id || '', fee: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      departmentId: course.departmentId,
      fee: course.fee,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      // Convert fee to float and departmentId to int
      const payload = { ...formData, fee: parseFloat(formData.fee), departmentId: parseInt(formData.departmentId) };
      if (editingCourse) {
        res = await api.put(`/courses/${editingCourse.id}`, payload);
      } else {
        res = await api.post('/courses', payload);
      }

      if (res.data.success) {
        toast.success(`Course ${editingCourse ? 'updated' : 'added'} successfully`);
        setIsModalOpen(false);
        fetchCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course? This will affect enrolled students and associated semesters/subjects.')) {
      try {
        const res = await api.delete(`/courses/${id}`);
        if (res.data.success) {
          toast.success('Course deleted');
          fetchCourses();
        }
      } catch (error) {
        toast.error('Failed to delete course');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage academic programs, fees, and departments.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            <MdAdd size={20} />
            Add Course
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-card rounded-2xl glass animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="glass bg-card rounded-2xl p-12 text-center border border-border">
          <MdBook size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No courses found</h3>
          <p className="text-muted-foreground mt-1">Get started by creating your first course.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {courses.map(course => {
            const uniqueSemesters = course.semesters ? course.semesters.filter((sem, index, self) => 
              index === self.findIndex((t) => t.name === sem.name)
            ) : [];
            return (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:border-primary/50 transition-colors"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold tracking-wider">
                    {course.courseCode}
                  </span>
                  {user?.role === 'ADMIN' && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(course)} className="p-1.5 text-muted-foreground hover:text-blue-500 rounded-md transition-colors"><MdEdit size={18} /></button>
                      <button onClick={() => handleDelete(course.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition-colors"><MdDelete size={18} /></button>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{course.courseName}</h3>
                <p className="text-sm text-muted-foreground mb-4">{course.department?.departmentName || 'Unknown Department'}</p>
                
                <div className="grid grid-cols-3 gap-4 text-sm mt-auto pt-4 border-t border-border text-center">
                  <div>
                    <p className="text-muted-foreground text-xs">Semesters</p>
                    <p className="font-medium text-foreground">{course._count?.semesters || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Students</p>
                    <p className="font-medium text-foreground">{course._count?.students || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Fee</p>
                    <p className="font-medium text-green-500">₹{course.fee?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Show subjects for STUDENTS and FACULTY */}
                {(user?.role === 'STUDENT' || user?.role === 'FACULTY') && course.semesters && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Course Subjects</h4>
                    <div className="space-y-4">
                      {uniqueSemesters.map(sem => (
                        <div key={sem.id} className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <p className="font-medium text-sm text-primary mb-2">{sem.name}</p>
                          <ul className="space-y-1">
                            {sem.subjects?.map(sub => (
                              <li key={sub.id} className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>• {sub.name}</span>
                                <span className="opacity-60">{sub.subjectCode}</span>
                              </li>
                            ))}
                            {(!sem.subjects || sem.subjects.length === 0) && (
                              <li className="text-xs text-muted-foreground italic">No subjects added</li>
                            )}
                          </ul>
                        </div>
                      ))}
                      {course.semesters.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No semesters configured yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {/* Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card glass w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden border border-border">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h2 className="text-xl font-bold text-foreground">{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><MdClose size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Course Name *</label>
                    <input required type="text" name="courseName" value={formData.courseName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Course Code *</label>
                    <input required type="text" name="courseCode" value={formData.courseCode} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Department *</label>
                    <select required name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary">
                      <option value="" disabled>Select a department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Total Fee (₹) *</label>
                    <input required type="number" min="0" name="fee" value={formData.fee} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-border">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 mt-4 rounded-lg border border-border text-foreground hover:bg-muted font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 mt-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">{editingCourse ? 'Update Course' : 'Create Course'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
