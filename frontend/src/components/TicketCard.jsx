import { Link } from 'react-router-dom';

export default function TicketCard({ ticket }) {
// THE FIX: Swap available_tickets for remaining_capacity
  const { ticket_id, home_team, away_team, sport_type, venue_city, ticket_date_time, price, category, remaining_capacity } = ticket;

  const isPast = ticket_date_time ? new Date(ticket_date_time) < new Date() : false;
  // THE FIX: Check remaining_capacity instead
  const isSoldOut = remaining_capacity === 0;

  
  // Decide which overlay to show (Past takes priority if both are somehow true)
  const overlayMode = isPast ? 'past' : (isSoldOut ? 'sold-out' : null);

  const getImage = (sportType) => {
    if (sportType?.toLowerCase() === 'football') return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmke4bJB0bvjlIltuqMF0KUyX1JSpnCLwctVB18GQtbw&s?q=80&w=2000&auto=format&fit=crop";
    if (sportType?.toLowerCase() === 'basketball') return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROReBnPVbho7vUB763hbL83EmLftuqp5_pzZWG7vBMDQ&s=10?q=80&w=2000&auto=format&fit=crop";
    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSdazy7HqyqThVU75m3bsJ8PVWFYLGo7e5S8OZmlGz3Q&s=10?q=80&w=2000&auto=format&fit=crop"; 
  };

  const formattedDate = ticket_date_time 
    ? new Date(ticket_date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    : 'Date TBD';

  return (
    <Link 
      to={`/ticket/${ticket_id}`} 
      className={`group bg-[#FFFFFF] dark:bg-[#232130] rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col block ${overlayMode ? 'opacity-80 grayscale-[0.6] hover:border-[#E5E7EB] dark:hover:border-[#2D2B3D]' : 'hover:border-[#8B5CF6] dark:hover:border-[#B794F4]'}`}
    >
      <div className="h-48 w-full overflow-hidden relative">
        <img 
          src={getImage(sport_type)} 
          alt={sport_type} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-3 left-3 bg-[#111827]/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {sport_type || 'Event'}
        </div>

        {category && (
          <div className="absolute top-3 right-3 bg-[#8B5CF6] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
            {category}
          </div>
        )}

        {/* THE FIX: Dynamic Overlays based on state */}
        {overlayMode === 'sold-out' && (
          <div className="absolute inset-0 bg-[#111827]/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-red-500 text-white font-extrabold px-4 py-2 rounded-lg tracking-widest uppercase transform -rotate-12 border-2 border-white/20 shadow-2xl text-sm">
              Sold Out
            </span>
          </div>
        )}

        {overlayMode === 'past' && (
          <div className="absolute inset-0 bg-[#111827]/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-[#374151] text-white font-extrabold px-4 py-2 rounded-lg tracking-widest uppercase transform -rotate-12 border-2 border-white/20 shadow-2xl text-sm">
              Past Event
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-[#111827] dark:text-[#FFFFFF] leading-tight mb-4 group-hover:text-[#8B5CF6] dark:group-hover:text-[#B794F4] transition-colors">
          {home_team || 'Team A'} <span className="text-[#6B7280] text-sm font-medium mx-1">vs</span> {away_team || 'Team B'}
        </h3>

        <div className="text-sm text-[#6B7280] dark:text-[#A2A2CC] mb-6 space-y-2 font-medium">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span>{venue_city || 'Location TBA'}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[#E5E7EB] dark:border-[#2D2B3D] flex justify-between items-center">
          <p className="text-xs text-[#6B7280] dark:text-[#A2A2CC] font-semibold uppercase tracking-wide">From</p>
          <p className={`text-xl font-extrabold ${overlayMode ? 'text-[#6B7280] dark:text-[#A2A2CC]' : 'text-[#7C3AED] dark:text-[#B794F4]'}`}>
            ${price || '0.00'}
          </p>
        </div>
      </div>
    </Link>
  );
}