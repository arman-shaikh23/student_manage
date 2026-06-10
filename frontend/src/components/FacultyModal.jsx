import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';
import api from '../services/api';

const FacultyModal = ({ isOpen, onClose, onSubmit, faculty, departments, courses = [] }) => {
  const [formData, setFormData] = useState({
    facultyId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',
    city: '',
    state: '',
    departmentId: '',
    status: 'Active',
    subjectIds: [],
  });
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (faculty) {
      setFormData({
        facultyId: faculty.facultyId || '',
        firstName: faculty.firstName || '',
        lastName: faculty.lastName || '',
        email: faculty.email || '',
        phone: faculty.phone || '',
        gender: faculty.gender || 'Male',
        dob: faculty.dob ? new Date(faculty.dob).toISOString().split('T')[0] : '',
        address: faculty.address || '',
        city: faculty.city || '',
        state: faculty.state || '',
        departmentId: faculty.departmentId || '',
        status: faculty.status || 'Active',
        subjectIds: faculty.subjects ? faculty.subjects.map(s => s.id.toString()) : [],
      });
      setProfileImage(null);
    } else {
      setFormData({
        facultyId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'Male',
        dob: '',
        address: '',
        city: '',
        state: '',
        departmentId: departments[0]?.id || '',
        status: 'Active',
        subjectIds: [],
      });
      setProfileImage(null);
    }
  }, [faculty, departments, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubjectChange = (subjectId) => {
    setFormData(prev => {
      const idStr = subjectId.toString();
      const isSelected = prev.subjectIds.includes(idStr);
      if (isSelected) {
        return { ...prev, subjectIds: prev.subjectIds.filter(id => id !== idStr) };
      } else {
        return { ...prev, subjectIds: [...prev.subjectIds, idStr] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'subjectIds') {
        formData.subjectIds.forEach(id => data.append('subjectIds', id));
      } else {
        data.append(key, formData[key]);
      }
    });
    if (profileImage) {
      data.append('profileImage', profileImage);
    }
    onSubmit(data, faculty?.id);
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
              {faculty ? 'Edit Faculty' : 'Add New Faculty'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <MdClose size={24} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="faculty-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Academic Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Faculty ID *</label>
                    <input required type="text" name="facultyId" placeholder="FAC20260001" value={formData.facultyId} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Department *</label>
                    <select required name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none">
                      <option value="" disabled>Select a department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
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

              {/* Family & Location */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Subjects Info */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Assigned Subjects</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-48 overflow-y-auto p-4 border border-border rounded-lg bg-background/50 custom-scrollbar">
                  {courses?.filter(c => c.departmentId === parseInt(formData.departmentId))?.flatMap(c => c.semesters?.flatMap(sem => sem.subjects?.map(sub => (
                    <label key={sub.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                      <input 
                        type="checkbox" 
                        checked={formData.subjectIds.includes(sub.id.toString())}
                        onChange={() => handleSubjectChange(sub.id)}
                        className="rounded border-border text-primary focus:ring-primary bg-background w-4 h-4"
                      />
                      <span className="text-sm text-foreground font-medium">{sub.name} <span className="text-xs text-muted-foreground block font-normal">{c.courseCode} - {sem.name}</span></span>
                    </label>
                  ))))}
                  {(!courses || courses.filter(c => c.departmentId === parseInt(formData.departmentId)).length === 0 || !courses.filter(c => c.departmentId === parseInt(formData.departmentId)).some(c => c.semesters?.some(sem => sem.subjects?.length > 0))) && (
                    <p className="text-sm text-muted-foreground italic col-span-3">No subjects available for the selected department</p>
                  )}
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
                      <option value="On Leave">On Leave</option>
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
            <button type="submit" form="faculty-form" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              {faculty ? 'Save Changes' : 'Add Faculty'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FacultyModal;
