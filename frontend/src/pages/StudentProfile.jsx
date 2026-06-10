import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdArrowBack, 
  MdEmail, 
  MdPhone, 
  MdLocationOn, 
  MdDateRange,
  MdCheckCircle,
  MdCancel,
  MdAssessment,
  MdAttachMoney,
  MdFamilyRestroom
} from 'react-icons/md';
import api from '../services/api';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const studentId = id || 'me';
        const res = await api.get(`/students/${studentId}`);
        if (res.data.success) {
          setStudent(res.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-12 text-muted-foreground">Student not found</div>;
  }

  // Calculate summaries
  const totalClasses = student.attendances?.length || 0;
  const presentClasses = student.attendances?.filter(a => a.status === 'Present').length || 0;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const totalExams = student.marks?.length || 0;
  const avgMarks = totalExams > 0 
    ? Math.round(student.marks.reduce((acc, curr) => acc + (curr.totalMarks ? ((curr.internalMarks || 0) + (curr.externalMarks || 0)) / curr.totalMarks : 0) * 100, 0) / totalExams) 
    : 0;

  const feeRecord = student.fees?.[0] || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-1 space-y-6">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center text-center"
          >
          <div className="relative w-32 h-32 mb-4">
            {student.profileImage ? (
              <img 
                src={`http://localhost:5000${student.profileImage}`} 
                alt={`${student.firstName} ${student.lastName}`} 
                className="w-full h-full rounded-full object-cover border-4 border-background shadow-lg"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl border-4 border-background shadow-lg">
                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
              </div>
            )}
            <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-background ${
              student.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">{student.firstName} {student.lastName}</h2>
          <p className="text-muted-foreground mb-4">{student.studentId}</p>
          
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
              {student.course?.courseCode || 'N/A'}
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {student.semester?.name || 'N/A'}
            </span>
          </div>

          <div className="w-full space-y-3 text-left">
            <div className="flex items-center text-sm text-muted-foreground">
              <MdEmail className="mr-3 text-primary" size={18} />
              <span className="text-foreground truncate">{student.email}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MdPhone className="mr-3 text-primary" size={18} />
              <span className="text-foreground">{student.phone}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MdDateRange className="mr-3 text-primary" size={18} />
              <span className="text-foreground">DOB: {new Date(student.dob).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MdLocationOn className="mr-3 text-primary" size={18} />
              <span className="text-foreground truncate">{student.city}, {student.state}</span>
            </div>
            {(student.parentName || student.parentPhone) && (
              <div className="flex items-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                <MdFamilyRestroom className="mr-3 text-primary" size={18} />
                <span className="text-foreground truncate">{student.parentName} ({student.parentPhone})</span>
              </div>
            )}
          </div>
        </motion.div>


      </div>

        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <MdCheckCircle className="text-blue-500" size={20} />
              </div>
              <h3 className="text-3xl font-bold text-foreground">{attendancePercentage}%</h3>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Average Marks</p>
                <MdAssessment className="text-purple-500" size={20} />
              </div>
              <h3 className="text-3xl font-bold text-foreground">{avgMarks}%</h3>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-muted-foreground">Fees Paid</p>
                <MdAttachMoney className={feeRecord?.status === 'Paid' ? 'text-green-500' : 'text-orange-500'} size={20} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                ₹{feeRecord ? feeRecord.paidFee.toLocaleString() : '0'} 
                <span className="text-sm text-muted-foreground font-normal block">
                  of ₹{feeRecord ? feeRecord.totalFee.toLocaleString() : '0'}
                </span>
              </h3>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Attendance */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass bg-card p-6 rounded-2xl border border-border shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Attendance</h3>
              {student.attendances && student.attendances.length > 0 ? (
                <div className="space-y-3">
                  {student.attendances.slice(0, 5).map(record => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex flex-col">
                         <span className="text-sm font-medium text-foreground">{record.subject?.name || 'N/A'}</span>
                         <span className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <span className={`flex items-center text-xs font-semibold ${
                        record.status === 'Present' ? 'text-green-500' :
                        record.status === 'Absent' ? 'text-red-500' : 'text-orange-500'
                      }`}>
                        {record.status === 'Present' ? <MdCheckCircle className="mr-1" /> : <MdCancel className="mr-1" />}
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendance records found.</p>
              )}
            </motion.div>

            {/* Recent Marks */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass bg-card p-6 rounded-2xl border border-border shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Marks</h3>
              {student.marks && student.marks.length > 0 ? (
                <div className="space-y-3">
                  {student.marks.slice(0, 5).map(record => {
                    const totalScored = (record.internalMarks || 0) + (record.externalMarks || 0);
                    return (
                      <div key={record.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{record.subject?.name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{new Date(record.examDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-foreground">{totalScored} <span className="text-muted-foreground font-normal">/ {record.totalMarks}</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No marks recorded yet.</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
