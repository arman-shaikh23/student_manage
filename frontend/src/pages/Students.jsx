import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  MdAdd, 
  MdSearch, 
  MdEdit, 
  MdDelete, 
  MdVisibility,
  MdDownload,
  MdPeople
} from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { exportToPDF } from '../utils/exportPDF';
import StudentModal from '../components/StudentModal';
import { AuthContext } from '../context/AuthContext';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchStudents = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/students?page=${page}&limit=${pagination.limit}&search=${search}`);
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination(prev => ({ ...prev, page: res.data.page, totalPages: res.data.totalPages }));
      }
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/academics/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load courses');
    }
  };

  useEffect(() => {
    fetchCourses();
    
    // Check if there is a search term in URL (from Header)
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    setSearchTerm(search);
    
    fetchStudents(1, search);
  }, [location.search]);

  // Listen for global search event
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setSearchTerm(e.detail);
      fetchStudents(1, e.detail);
    };
    window.addEventListener('globalSearch', handleGlobalSearch);
    return () => window.removeEventListener('globalSearch', handleGlobalSearch);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Debouncing happens implicitly by user pausing typing, but a real debounce hook is better.
    // For simplicity, we trigger on Enter or let the user type and hit search icon.
  };

  const handleSearchSubmit = (e) => {
    if(e) e.preventDefault();
    fetchStudents(1, searchTerm);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const res = await api.delete(`/students/${id}`);
        if (res.data.success) {
          toast.success('Student deleted successfully');
          fetchStudents(pagination.page, searchTerm);
        }
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const handleModalSubmit = async (formData, id = null) => {
    try {
      let res;
      if (id) {
        res = await api.put(`/students/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/students', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        toast.success(`Student ${id ? 'updated' : 'added'} successfully`);
        setIsModalOpen(false);
        fetchStudents(pagination.page, searchTerm);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'ID', accessor: 'studentId' },
      { header: 'Name', accessor: (row) => `${row.firstName} ${row.lastName}` },
      { header: 'Email', accessor: 'email' },
      { header: 'Phone', accessor: 'phone' },
      { header: 'Course', accessor: (row) => row.course?.courseCode || 'N/A' },
      { header: 'Status', accessor: 'status' },
    ];
    exportToPDF(students, columns, 'Students Report', 'students_report');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all student records and profiles.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
          >
            <MdDownload size={20} />
            Export PDF
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
            >
              <MdAdd className="-ml-1 mr-2 h-5 w-5" />
              Add Student
            </button>
          )}
        </div>
      </div>

      <div className="glass bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              placeholder="Search by ID, name, email..."
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Student ID</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Course</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <MdPeople size={48} className="text-muted-foreground mb-4 opacity-50" />
                      <p className="text-lg font-medium text-foreground">No students found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or add a new student.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{student.studentId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.profileImage ? (
                          <img src={`http://localhost:5000${student.profileImage}`} alt={student.firstName} className="w-8 h-8 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-xs">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {student.course?.courseCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        student.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        student.status === 'Suspended' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="text-muted-foreground hover:text-foreground transition-colors mr-3"
                          title="View Profile"
                        >
                          <MdVisibility size={20} />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <>
                            <button 
                              onClick={() => openEditModal(student)}
                              className="text-primary hover:text-primary/80 transition-colors mr-3"
                              title="Edit"
                            >
                              <MdEdit size={20} />
                            </button>
                            <button 
                              onClick={() => handleDelete(student.id)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Delete"
                            >
                              <MdDelete size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && students.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{pagination.page}</span> of <span className="font-medium text-foreground">{pagination.totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page === 1}
                onClick={() => fetchStudents(pagination.page - 1, searchTerm)}
                className="px-3 py-1 rounded border border-border bg-background text-foreground text-sm hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchStudents(pagination.page + 1, searchTerm)}
                className="px-3 py-1 rounded border border-border bg-background text-foreground text-sm hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <StudentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        student={editingStudent}
        courses={courses}
      />
    </div>
  );
};

export default Students;
