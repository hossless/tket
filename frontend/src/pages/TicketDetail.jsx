import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SeatSelectorModal from '../components/SeatSelectorModal';

import footballImg from '../assets/images/football.png';
import basketballImg from '../assets/images/basketball.png';
import volleyballImg from '../assets/images/volleyball.png';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState(null);
  
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tickets/${id}/`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Ticket not found.");
          throw new Error("Failed to load ticket details.");
        }
        
        const data = await response.json();
        setTicket(data.ticket_info);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const getImage = (sportType) => {
    const type = sportType?.toLowerCase();
    if (type === 'football') return footballImg;
    if (type === 'basketball') return basketballImg;
    if (type === 'volleyball') return volleyballImg;
    return footballImg; 
  };

  const isPast = ticket?.ticket_date_time ? new Date(ticket.ticket_date_time) < new Date() : false;
  const isSoldOut = ticket?.remaining_capacity === 0;
  const maxAllowed = ticket ? Math.min(10, ticket.remaining_capacity) : 1;

  const handleOpenSeatSelection = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setIsSeatModalOpen(true);
  };

  const handleFinalReserve = async (seatString) => {
    setIsSeatModalOpen(false);
    setReserving(true);
    setReserveError(null);

    // Remove the (xNumber) from the seat string before sending to DB
    const cleanSeatString = seatString.replace(/\s*\(x\d+\)\s*$/, '');

    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/tickets/reserve/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ticket_id: parseInt(id),
          quantity: quantity,
          seat_info: cleanSeatString
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reservation failed.");
      }

      navigate('/dashboard'); 

    } catch (err) {
      setReserveError(err.message);
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-[#8B5CF6] animate-pulse">Loading Event...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-[#FF6E6E]">{error}</div>;
  if (!ticket) return null;

  return (
    <div className="pb-24">
      <div className="relative h-[45vh] w-full">
        <img src={getImage(ticket.sport_type)} alt={ticket.sport_type} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F9FAFB] dark:from-[#1A1924] via-transparent to-black/30"></div>
        <div className="absolute top-8 left-8 flex gap-3">
          <span className="bg-[#111827]/80 backdrop-blur-md text-white text-sm font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{ticket.sport_type}</span>
          <span className="bg-[#8B5CF6]/90 backdrop-blur-md text-white text-sm font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{ticket.category}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl p-8 shadow-sm border border-[#E5E7EB] dark:border-[#2D2B3D]">
              <h4 className="text-[#8B5CF6] dark:text-[#B794F4] font-bold tracking-widest uppercase mb-2 text-sm">{ticket.tournament_name || 'Exhibition Match'}</h4>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tighter leading-none mb-6">{ticket.home_team} <br/> <span className="text-[#6B7280] dark:text-[#A2A2CC] text-3xl">vs</span> {ticket.away_team}</h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-6 border-t border-[#E5E7EB] dark:border-[#2D2B3D]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F3F4F6] dark:bg-[#1A1924] flex items-center justify-center text-[#8B5CF6]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Date & Time</p>
                    <p className="font-bold text-[#111827] dark:text-[#FFFFFF]">{new Date(ticket.ticket_date_time).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F3F4F6] dark:bg-[#1A1924] flex items-center justify-center text-[#8B5CF6]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Venue</p>
                    <p className="font-bold text-[#111827] dark:text-[#FFFFFF]">{ticket.venue_name}, {ticket.venue_city}</p>
                  </div>
                </div>
              </div>
            </div>

            {ticket.facilities && (
              <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl p-8 shadow-sm border border-[#E5E7EB] dark:border-[#2D2B3D]">
                <h2 className="text-2xl font-bold text-[#111827] dark:text-[#FFFFFF] mb-4">Venue Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {ticket.facilities.split(',').map((facility, index) => (
                    <span key={index} className="px-4 py-2 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#4B5563] dark:text-[#A2A2CC] font-semibold text-sm">
                      {facility.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white/80 dark:bg-[#232130]/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-[#2D2B3D] pb-6">
                <div>
                  <p className="text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-widest mb-1">Price</p>
                  <p className="text-4xl font-extrabold text-[#111827] dark:text-[#FFFFFF] leading-none">${ticket.price.toFixed(2)}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-widest mb-2">Status</p>
                  {isPast ? (
                    <span className="text-[#6B7280] font-bold bg-[#E5E7EB] dark:bg-[#1A1924] px-4 py-1.5 rounded-lg text-sm leading-none">Past Event</span>
                  ) : isSoldOut ? (
                    <span className="text-[#FF6E6E] font-bold bg-[#FF6E6E]/10 px-4 py-1.5 rounded-lg text-sm leading-none">Sold Out</span>
                  ) : (
                    <span className="text-[#50FA7B] font-bold bg-[#50FA7B]/10 border border-[#50FA7B]/20 px-4 py-1.5 rounded-lg text-sm leading-none">{ticket.remaining_capacity} Left</span>
                  )}
                </div>
              </div>

              {!isPast && !isSoldOut && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-[#111827] dark:text-[#FFFFFF]">Select Seats</label>
                  <div className="flex items-center justify-between bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] rounded-xl p-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-10 h-10 rounded-lg flex items-center justify-center text-[#111827] dark:text-[#FFFFFF] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2B3D] disabled:opacity-30 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                    </button>
                    <span className="text-xl font-bold text-[#111827] dark:text-[#FFFFFF] w-12 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))} disabled={quantity >= maxAllowed} className="w-10 h-10 rounded-lg flex items-center justify-center text-[#111827] dark:text-[#FFFFFF] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2B3D] disabled:opacity-30 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {!isPast && !isSoldOut && (
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Total</span>
                  <span className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">${(ticket.price * quantity).toFixed(2)}</span>
                </div>
              )}

              {reserveError && <div className="p-3 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] text-sm font-bold rounded-xl text-center">{reserveError}</div>}

              {isPast || isSoldOut ? (
                <button disabled className="w-full py-4 rounded-xl font-extrabold text-white bg-gray-400 dark:bg-gray-700 cursor-not-allowed">Tickets Unavailable</button>
              ) : (
                <button 
                  onClick={handleOpenSeatSelection}
                  disabled={reserving}
                  className="relative w-full py-4 rounded-xl font-extrabold text-white bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:from-[#6D28D9] hover:to-[#7C3AED] transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)] flex justify-center items-center gap-2"
                >
                  {reserving ? 'Processing...' : (isAuthenticated ? 'Select Seats' : 'Login to Reserve')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SeatSelectorModal 
        isOpen={isSeatModalOpen} 
        onClose={() => setIsSeatModalOpen(false)} 
        sportType={ticket.sport_type}
        quantity={quantity}
        onConfirm={handleFinalReserve}
      />
    </div>
  );
}