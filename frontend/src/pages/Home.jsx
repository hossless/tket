import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TicketCard from '../components/TicketCard';

export default function Home() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 50);

    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/tickets/search/?exclude_sold_out=true&show_past=false');
        if (!response.ok) throw new Error("Failed to fetch");
        
        const rawJson = await response.json();
        const ticketArray = rawJson.data.tickets;

        setTickets(ticketArray.slice(0, 8));
        setLoading(false);
      } catch (err) {
        setError("Could not connect to the database. Are your Docker containers running?");
        setLoading(false);
      }
    };

    fetchTickets();
  }, []); 

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/search?q=${searchQuery}` : '/search');
  };

  const handleSportClick = (sport) => {
    navigate(`/search?sport_type=${sport}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      
      <div className="py-24 flex flex-col md:flex-row items-center justify-between gap-12 relative">
        
        <div className={`md:w-1/2 space-y-4 relative z-10 transition-all duration-1000 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter mb-2 drop-shadow-[0_0_5px_rgba(139,92,246,0.4)] dark:drop-shadow-[0_0_5px_rgba(139,92,246,0.4)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4F46E5] via-[#8B5CF6] to-[#C084FC] font-['Plus_Jakarta_Sans']">
              tket.
            </span>
          </h1>

          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-tight font-['Plus_Jakarta_Sans']">
            Your Pass to the Game.
          </h2>
          <p className="text-lg text-[#6B7280] dark:text-[#A2A2CC] leading-relaxed max-w-lg font-medium pt-2">
            Experience the thrill of live sports. Search thousands of events and secure your seats in seconds with our lightning-fast checkout.
          </p>
        </div>
        
        <div className={`hidden md:block md:w-1/2 relative h-80 perspective-1000 transition-all duration-1000 delay-300 transform ${isMounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full blur-[100px] opacity-40 dark:opacity-30"></div>
          
          <div className="absolute right-16 top-12 w-64 h-40 bg-white/80 dark:bg-[#232130]/80 backdrop-blur-xl border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl transform rotate-[-12deg] hover:rotate-[-5deg] transition-all duration-500 p-5 flex flex-col justify-between z-20">
            <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700/50 pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" className="w-20 h-6 fill-[#111827] dark:fill-white opacity-80">
                <rect x="0" y="0" width="4" height="20" />
                <rect x="8" y="0" width="2" height="20" />
                <rect x="14" y="0" width="8" height="20" />
                <rect x="26" y="0" width="4" height="20" />
                <rect x="34" y="0" width="2" height="20" />
                <rect x="40" y="0" width="12" height="20" />
                <rect x="56" y="0" width="4" height="20" />
                <rect x="64" y="0" width="8" height="20" />
                <rect x="76" y="0" width="2" height="20" />
                <rect x="82" y="0" width="6" height="20" />
                <rect x="92" y="0" width="8" height="20" />
              </svg>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#B794F4]"></div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="h-2 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-2 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          <div className="absolute right-0 top-24 w-64 h-40 bg-gray-100/90 dark:bg-[#1C1A27]/80 backdrop-blur-md border border-gray-300 dark:border-[#2D2B3D]/50 rounded-2xl shadow-xl transform rotate-[8deg] transition-all duration-500 p-5 z-10 flex flex-col justify-center">
             <div className="w-full h-full border-2 border-dashed border-gray-400 dark:border-gray-600/50 rounded-xl flex items-center justify-center">
               <span className="text-gray-500 dark:text-gray-400 font-mono text-sm tracking-widest font-bold">ADMIT ONE</span>
             </div>
          </div>
        </div>
      </div>

      <div className={`mb-16 space-y-5 relative z-20 -mt-10 md:mt-0 transition-all duration-1000 delay-500 transform ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search teams, cities, or venues..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] shadow-lg text-lg transition-all"
          />
          <button 
            type="submit"
            className="bg-[#8B5CF6] dark:bg-[#B794F4] text-white dark:text-[#1A1924] px-5 py-5 rounded-2xl font-bold hover:bg-[#7C3AED] dark:hover:bg-[#9F7AEA] transition-colors shadow-lg text-lg active:scale-95"
          >
            Search
          </button>
        </form>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {['Football', 'Basketball', 'Volleyball'].map(sport => (
            <button 
              key={sport}
              onClick={() => handleSportClick(sport)}
              className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap bg-[#FFFFFF] dark:bg-[#232130] text-[#6B7280] dark:text-[#A2A2CC] border border-[#E5E7EB] dark:border-[#2D2B3D] hover:border-[#8B5CF6] dark:hover:border-[#B794F4] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] shadow-sm active:scale-95"
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex justify-between items-end mb-8 transition-all duration-1000 delay-700 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h2 className="text-3xl font-bold text-[#111827] dark:text-[#FFFFFF] tracking-tight">Upcoming Highlights</h2>
      </div>
          
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-[#FFFFFF] dark:bg-[#232130] rounded-2xl p-4 shadow-sm border border-[#E5E7EB] dark:border-[#2D2B3D] animate-pulse">
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
              <div className="flex justify-between items-end pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center text-[#FF6E6E] font-bold bg-[#FF6E6E]/10 rounded-2xl border border-[#FF6E6E]/20">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tickets.map((ticket, index) => (
              <div 
                key={ticket.ticket_id} 
                className={`transition-all duration-700 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <TicketCard ticket={ticket} />
              </div>
            ))}
          </div>

          <div className={`mt-16 text-center transition-all duration-1000 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
            <Link 
              to="/search" 
              className="inline-flex items-center gap-2 border border-[#8B5CF6] dark:border-[#B794F4] text-[#8B5CF6] dark:text-[#B794F4] px-8 py-3.5 rounded-full font-bold hover:bg-[#8B5CF6] hover:text-white dark:hover:bg-[#B794F4] dark:hover:text-[#1A1924] transition-all group active:scale-95"
            >
              Browse All Tickets 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </>
      )}

    </div>
  );
}