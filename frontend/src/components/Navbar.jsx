import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const [isDark, setIsDark] = useState(true);
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout(); 
    navigate('/'); 
  };

  return (
    <nav className="bg-[#FFFFFF] dark:bg-[#232130] border-b border-[#E5E7EB] dark:border-[#2D2B3D] p-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[#8B5CF6] dark:text-[#B794F4] text-2xl font-bold tracking-tighter">
            tket.
          </Link>

          
          <div className={`relative ${isHomePage ? 'hidden' : 'hidden md:flex'}`}>
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-64 pl-10 pr-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] dark:focus:ring-[#B794F4] transition-all text-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF] dark:text-[#6B7280]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated && (
            <Link to="/dashboard" className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#111827] dark:hover:text-white font-medium transition text-sm">Dashboard</Link>
          )}
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D] transition-colors"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              className="text-[#8B5CF6] dark:text-[#B794F4] border border-[#8B5CF6] dark:border-[#B794F4] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D] px-5 py-2 rounded-md font-semibold transition-colors text-sm"
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="bg-[#8B5CF6] dark:bg-[#B794F4] text-white dark:text-[#1A1924] px-5 py-2 rounded-md font-semibold hover:bg-[#7C3AED] dark:hover:bg-[#9F7AEA] transition-colors shadow-sm text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}