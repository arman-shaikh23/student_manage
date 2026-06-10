import { useContext, useState, useEffect } from 'react';
import { MdMenu, MdNotifications, MdDarkMode, MdLightMode, MdSearch, MdLogout } from 'react-icons/md';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { admin, logout } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Debounce search effect (basic implementation, can be lifted to context or page level)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm && location.pathname !== '/students') {
        // If not on students page, maybe redirect or just emit an event
        navigate(`/students?search=${searchTerm}`);
      } else if (location.pathname === '/students') {
        // Just dispatch a custom event that the Students page can listen to
        window.dispatchEvent(new CustomEvent('globalSearch', { detail: searchTerm }));
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, navigate, location.pathname]);

  return (
    <header className="bg-card glass border-b border-border z-10">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center flex-1">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted focus:outline-none"
            onClick={onMenuClick}
          >
            <MdMenu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="hidden sm:flex flex-1 ml-4 items-center max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-full leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
              placeholder="Search students, courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
          </button>

          <button className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors relative">
            <MdNotifications size={20} />
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          </button>

          <div className="flex items-center gap-3 border-l border-border pl-4 ml-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none text-foreground">{admin?.email.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground mt-1">Administrator</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
              {admin?.email.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors ml-2"
              title="Logout"
            >
              <MdLogout size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
