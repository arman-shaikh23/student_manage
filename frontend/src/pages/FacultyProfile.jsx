import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdArrowBack, 
  MdEmail, 
  MdPhone, 
  MdLocationOn, 
  MdDateRange,
  MdBook,
  MdBadge
} from 'react-icons/md';
import api, { BASE_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const FacultyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const facultyId = id || 'me';
        const res = await api.get(`/faculty/${facultyId}`);
        if (res.data.success) {
          setFaculty(res.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!faculty) {
    return <div className="text-center py-12 text-muted-foreground">Faculty not found</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {user?.role === 'ADMIN' && id && (
        <button 
          onClick={() => navigate('/faculty')}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <MdArrowBack className="mr-2" /> Back to Faculty
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 glass bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center text-center"
        >
          <div className="relative w-32 h-32 mb-4">
            {faculty.profileImage ? (
              <img 
                src={`${BASE_URL}${faculty.profileImage}`} 
                alt={`${faculty.firstName} ${faculty.lastName}`} 
                className="w-full h-full rounded-full object-cover border-4 border-background shadow-lg"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl border-4 border-background shadow-lg">
                {faculty.firstName.charAt(0)}{faculty.lastName.charAt(0)}
              </div>
            )}
            <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-background ${
              faculty.status === 'Active' ? 'bg-green-500' : 
              faculty.status === 'On Leave' ? 'bg-orange-500' : 'bg-gray-400'
            }`}></div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">{faculty.firstName} {faculty.lastName}</h2>
          <p className="text-muted-foreground mb-4">{faculty.facultyId}</p>
          
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium flex items-center">
              <MdBadge className="mr-1" /> {faculty.department?.departmentName || 'N/A'}
            </span>
          </div>

          <div className="w-full space-y-3 text-left">
            <div className="flex items-center text-sm text-muted-foreground">
              <MdEmail className="mr-3 text-primary" size={18} />
              <span className="text-foreground truncate">{faculty.email}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MdPhone className="mr-3 text-primary" size={18} />
              <span className="text-foreground">{faculty.phone}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MdDateRange className="mr-3 text-primary" size={18} />
              <span className="text-foreground">DOB: {new Date(faculty.dob).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MdLocationOn className="mr-3 text-primary" size={18} />
              <span className="text-foreground truncate">{faculty.city}, {faculty.state}</span>
            </div>
          </div>
        </motion.div>

        <div className="col-span-1 md:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass bg-card p-6 rounded-2xl border border-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Assigned Subjects</h3>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
                Total: {faculty.subjects?.length || 0}
              </div>
            </div>

            {faculty.subjects && faculty.subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {faculty.subjects.map(subject => (
                  <div key={subject.id} className="p-4 bg-muted/30 rounded-xl border border-border flex items-start gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <MdBook size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{subject.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">Code: {subject.subjectCode}</p>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-background border border-border rounded text-muted-foreground">
                          {subject.semester?.course?.courseCode || 'Course'}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-background border border-border rounded text-muted-foreground">
                          {subject.semester?.name || 'Semester'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MdBook className="mx-auto text-4xl text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground">No subjects currently assigned to this faculty.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfile;
