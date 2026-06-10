import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  MdDashboard, 
  MdPeople, 
  MdBook, 
  MdCheckCircle, 
  MdAssessment,
  MdClose,
  MdAttachMoney,
  MdBadge,
  MdPerson
} from 'react-icons/md';

const Sidebar = ({ onClose }) => {
  const { user } = useContext(AuthContext);

  const adminNav = [
    { name: 'Dashboard', path: '/', icon: MdDashboard },
    { name: 'Students', path: '/students', icon: MdPeople },
    { name: 'Faculty', path: '/faculty', icon: MdBadge },
    { name: 'Courses', path: '/courses', icon: MdBook },
    { name: 'Fees & Payments', path: '/fees', icon: MdAttachMoney },
  ];

  const facultyNav = [
    { name: 'Dashboard', path: '/', icon: MdDashboard },
    { name: 'My Profile', path: '/profile', icon: MdPerson },
    { name: 'Assigned Students', path: '/students', icon: MdPeople },
    { name: 'My Courses', path: '/courses', icon: MdBook },
    { name: 'Attendance', path: '/attendance', icon: MdCheckCircle },
    { name: 'Marks', path: '/marks', icon: MdAssessment },
  ];

  const studentNav = [
    { name: 'My Dashboard', path: '/', icon: MdDashboard },
    { name: 'My Profile', path: '/profile', icon: MdPerson },
    { name: 'My Courses', path: '/courses', icon: MdBook },
    { name: 'My Attendance', path: '/attendance', icon: MdCheckCircle },
    { name: 'My Grades', path: '/marks', icon: MdAssessment },
    { name: 'My Fees', path: '/fees', icon: MdAttachMoney },
  ];

  let navItems = [];
  if (user?.role === 'ADMIN') navItems = adminNav;
  else if (user?.role === 'FACULTY') navItems = facultyNav;
  else if (user?.role === 'STUDENT') navItems = studentNav;

  return (
    <div className="flex h-full flex-col bg-card border-r border-border glass">
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <h1 className="text-xl font-bold tracking-wider text-primary">SMS<span className="text-primary/60">Pro</span></h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
            <MdClose size={24} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="bg-muted/50 p-4 rounded-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">System Status</p>
          <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
