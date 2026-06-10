import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import StudentProfile from './StudentProfile';
import FacultyProfile from './FacultyProfile';

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (user?.role === 'FACULTY') {
    return <FacultyProfile />;
  }

  if (user?.role === 'STUDENT') {
    return <StudentProfile />;
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      Profile view is not available for this role.
    </div>
  );
};

export default Profile;
