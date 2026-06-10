import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import api, { BASE_URL } from '../services/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import FacultyModal from '../components/FacultyModal';

const Faculty = () => {
  const { user } = useContext(AuthContext);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const [courses, setCourses] = useState([]);

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

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await api.get('/faculty');
      if (res.data.success) {
        setFaculties(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchDepartments();
    fetchCourses();
  }, []);

  const openAddModal = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const openEditModal = (faculty) => {
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData, id) => {
    try {
      let res;
      if (id) {
        res = await api.put(`/faculty/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/faculty', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        toast.success(`Faculty ${id ? 'updated' : 'added'} successfully`);
        setIsModalOpen(false);
        fetchFaculties();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        const res = await api.delete(`/faculty/${id}`);
        if (res.data.success) {
          toast.success('Faculty deleted successfully');
          fetchFaculties();
        }
      } catch (error) {
        toast.error('Failed to delete faculty');
      }
    }
  };

  const filteredFaculties = faculties.filter(f => 
    f.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.facultyId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Faculty Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff, assignments, and access</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={openAddModal} className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95">
            <MdAdd className="-ml-1 mr-2 h-5 w-5" />
            Add Faculty
          </button>
        )}
      </div>

      <div className="bg-card glass rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faculty ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                {user?.role === 'ADMIN' && <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Loading faculty...</td>
                </tr>
              ) : filteredFaculties.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">No faculty found</td>
                </tr>
              ) : (
                filteredFaculties.map((faculty) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={faculty.id} 
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {faculty.facultyId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {faculty.profileImage ? (
                            <img src={`${BASE_URL}${faculty.profileImage}`} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            faculty.firstName.charAt(0)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">{faculty.firstName} {faculty.lastName}</div>
                          <div className="text-sm text-muted-foreground">{faculty.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {faculty.department?.departmentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${faculty.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {faculty.status}
                      </span>
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(faculty)} className="text-primary hover:text-primary/80 mr-3 transition-colors" title="Edit">
                          <MdEdit size={20} />
                        </button>
                        <button onClick={() => handleDelete(faculty.id)} className="text-destructive hover:text-destructive/80 transition-colors" title="Delete">
                          <MdDelete size={20} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FacultyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        faculty={editingFaculty}
        departments={departments}
        courses={courses}
      />
    </div>
  );
};

export default Faculty;
