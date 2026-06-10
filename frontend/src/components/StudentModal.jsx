import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';
import api from '../services/api';

const StudentModal = ({ isOpen, onClose, onSubmit, student, courses }) => {
  const [semesters, setSemesters] = useState([]);
  const [fetchingSemesters, setFetchingSemesters] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',
    city: '',
    state: '',
    parentName: '',
    parentPhone: '',
    courseId: '',
    semesterId: '',
    status: 'Active',
  });
  const [profileImage, setProfileImage] = useState(null);

  // Fetch semesters whenever courseId changes
  useEffect(() => {
    const fetchSemesters = async () => {
      if (!formData.courseId) {
        setSemesters([]);
        return;
      }
      setFetchingSemesters(true);
      try {
        const res = await api.get(`/academics/courses/${formData.courseId}/semesters`);
        if (res.data.success) {
          setSemesters(res.data.data);
          // Auto select first semester if current is invalid
          if (!res.data.data.find(s => s.id === parseInt(formData.semesterId))) {
             setFormData(prev => ({ ...prev, semesterId: res.data.data[0]?.id || '' }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch semesters", error);
      }
      setFetchingSemesters(false);
    };

    if (isOpen) {
      fetchSemesters();
    }
  }, [formData.courseId, isOpen]);

  useEffect(() => {
    if (student) {
      setFormData({
        studentId: student.studentId || '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        phone: student.phone || '',
        gender: student.gender || 'Male',
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        courseId: student.courseId || '',
        semesterId: student.semesterId || '',
        status: student.status || 'Active',
      });
      setProfileImage(null);
    } else {
      setFormData({
        studentId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'Male',
        dob: '',
        address: '',
        city: '',
        state: '',
        parentName: '',
        parentPhone: '',
        courseId: courses[0]?.id || '',
        semesterId: '',
        status: 'Active',
      });
      setProfileImage(null);
    }
  }, [student, courses, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (profileImage) {
      data.append('profileImage', profileImage);
    }
    onSubmit(data, student?.id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card glass w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col border border-border"
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">
              {student ? 'Edit Student' : 'Add New Student'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <MdClose size={24} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="student-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Academic Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Academic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Student ID *</label>
                    <input required type="text" name="studentId" placeholder="STU20260001" value={formData.studentId} onChange={handleChange} pattern="STU202\d{5}" title="Must be format STU202XXXXX" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Course *</label>
                    <select required name="courseId" value={formData.courseId} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none">
                      <option value="" disabled>Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.courseName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Semester *</label>
                    <select required name="semesterId" value={formData.semesterId} onChange={handleChange} disabled={fetchingSemesters || semesters.length === 0} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none disabled:opacity-50">
                      {fetchingSemesters ? <option>Loading...</option> : <option value="" disabled>Select a semester</option>}
                      {semesters.map(sem => (
                        <option key={sem.id} value={sem.id}>{sem.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name *</label>
                    <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name *</label>
                    <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date of Birth *</label>
                    <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email Address *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number *</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} pattern="\d{10}" title="Must be exactly 10 digits" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Family & Contact */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Family & Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Parent Name</label>
                    <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Parent Phone</label>
                    <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} pattern="\d{10}" title="Must be exactly 10 digits" className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">Address *</label>
                    <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                    <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Profile Image</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 outline-none" />
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/30">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium">Cancel</button>
            <button type="submit" form="student-form" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              {student ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentModal;
