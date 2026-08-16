import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const [isDark, setIsDark] = useState(true);
  const [navSearch, setNavSearch] = useState('');
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const location = useLocation();
  const hideSearchBar = location.pathname === '/' || location.pathname === '/search';

  useEffect(() => {
    const savedTheme = localStorage.getItem('tket_theme');
    if (savedTheme === 'light') {
      setIsDark(false);
    } else {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tket_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tket_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    logout(); 
    navigate('/'); 
  };

  const handleNavSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(navSearch.trim() ? `/search?q=${navSearch}` : '/search');
      setNavSearch('');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#FFFFFF]/90 dark:bg-[#1A1924]/90 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[#2D2B3D] py-4 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[#111827] dark:text-[#FFFFFF] text-2xl font-extrabold tracking-tighter hover:opacity-80 transition-opacity">
            tket.
          </Link>

          <div className={`relative ${hideSearchBar ? 'hidden' : 'hidden md:flex'}`}>
            <input 
              type="text" 
              placeholder="Search events, teams, venues..." 
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={handleNavSearch}
              className="w-72 pl-10 pr-4 py-2.5 rounded-full bg-[#F9FAFB] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all text-sm font-medium"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-4 top-3 text-[#9CA3AF] dark:text-[#6B7280]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D] transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative group">
              <Link 
                to="/dashboard" 
                state={{ targetTab: 'Profile' }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9F7AEA] to-[#B794F4] text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform shrink-0 relative z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
              
              <div className="absolute top-full right-0 w-full h-4"></div>

              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 bg-[#FFFFFF] dark:bg-[#232130] rounded-2xl shadow-xl border border-[#E5E7EB] dark:border-[#2D2B3D] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right translate-y-2 group-hover:translate-y-0 overflow-hidden z-20">
                <div className="py-2">
                  <Link 
                    to="/dashboard" 
                    state={{ targetTab: 'Tickets' }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1924] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#8B5CF6]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                    My Tickets
                  </Link>

                  <Link 
                    to="/dashboard" 
                    state={{ targetTab: 'Profile' }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1924] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#8B5CF6]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                    Profile Settings
                  </Link>

                  <Link 
                    to="/dashboard" 
                    state={{ targetTab: 'Support' }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1924] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#8B5CF6]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                    Support Reports
                  </Link>
                  
                  <div className="h-[1px] bg-[#E5E7EB] dark:bg-[#2D2B3D] my-2"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#FF6E6E] hover:bg-[#FF6E6E]/10 transition-colors text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
                    Log out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/login" 
                className="text-[#111827] dark:text-[#FFFFFF] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] font-bold transition-colors text-sm px-2"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="bg-[#111827] dark:bg-[#FFFFFF] text-white dark:text-[#1A1924] px-5 py-2.5 rounded-full font-bold hover:scale-[1.02] transition-transform shadow-md text-sm shrink-0"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}