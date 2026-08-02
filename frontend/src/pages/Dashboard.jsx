import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';

const CountdownTimer = ({ reservationId }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedEndTime = sessionStorage.getItem(`tket_timer_end_${reservationId}`);
    if (savedEndTime) {
      return Math.max(0, Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000));
    }
    const newEndTime = Date.now() + 600 * 1000;
    sessionStorage.setItem(`tket_timer_end_${reservationId}`, newEndTime.toString());
    return 600;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      const savedEndTime = parseInt(sessionStorage.getItem(`tket_timer_end_${reservationId}`), 10);
      setTimeLeft(Math.max(0, Math.floor((savedEndTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [reservationId]);

  if (timeLeft === 0) return <span>Hold Expired</span>;
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  return <span>Hold expires in {minutes}:{seconds}</span>;
};

export default function Dashboard() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'Pending');  
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [isFetchingPenalty, setIsFetchingPenalty] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    if (successMsg) {
      window.history.replaceState({}, document.title); 
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('tket_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch('http://localhost:8000/api/user/reservations/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load reservations.");
      const data = await response.json();
      setReservations(data.reservations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    else fetchReservations();
  }, [isAuthenticated, navigate]);

  const openCancelModal = async (res) => {
    setSelectedForCancel(res);
    setIsCancelModalOpen(true);
    setIsFetchingPenalty(true);
    setPenaltyInfo(null);

    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch(`http://localhost:8000/api/tickets/reservations/${res.reservation_id}/penalty/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Could not calculate penalty.");
      const data = await response.json();
      
      setPenaltyInfo(data.cancellation_penalty); 
    } catch (err) {
      setPenaltyInfo({
        total_amount: res.price * res.quantity,
        penalty_percent: 20,
        penalty_amount: (res.price * res.quantity) * 0.20, 
        refund_amount: (res.price * res.quantity) * 0.80
      });
    } finally {
      setIsFetchingPenalty(false);
    }
  };

  const handleFinalCancel = async () => {
    setIsCanceling(true);
    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/user/reservations/cancel/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reservation_id: selectedForCancel.reservation_id })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cancellation failed.");

      setIsCancelModalOpen(false);
      setSuccessMsg(`Reservation canceled. $${data.cancellation_details.refund_amount} will be refunded.`);
      await fetchReservations();
      setActiveTab('Canceled & Expired');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'Canceled & Expired') return res.status === 'Canceled' || res.status === 'Expired';
    return res.status === activeTab;
  });
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#8B5CF6] animate-pulse text-2xl">Loading Dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight">My Tickets</h1>
        <p className="text-[#6B7280] dark:text-[#A2A2CC] mt-2 font-medium">Manage your upcoming events, payments, and history.</p>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 bg-[#50FA7B]/10 border border-[#50FA7B]/20 text-[#50FA7B] font-bold rounded-xl text-center shadow-sm animate-in fade-in slide-in-from-top-4">
          {successMsg}
        </div>
      )}

      <div className="flex gap-8 border-b border-[#E5E7EB] dark:border-[#2D2B3D] mb-8 overflow-x-auto scrollbar-hide">
        {['Pending', 'Confirmed', 'Canceled & Expired'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 whitespace-nowrap font-bold text-sm transition-all duration-300 relative ${
              activeTab === tab ? 'text-[#8B5CF6] dark:text-[#B794F4]' : 'text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#111827] dark:hover:text-[#FFFFFF]'
            }`}
          >
            {tab} 
            {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#8B5CF6] dark:bg-[#B794F4] rounded-t-lg"></span>}
          </button>
        ))}
      </div>

      {error && <div className="mb-8 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] font-bold rounded-xl">{error}</div>}

      {filteredReservations.length === 0 ? (
        <div className="py-20 text-center bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-[#9CA3AF] dark:text-[#6B7280] mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
          </svg>
          <h3 className="text-xl font-bold text-[#111827] dark:text-[#FFFFFF] mb-2">No {activeTab.toLowerCase()} tickets</h3>
          <p className="text-[#6B7280] dark:text-[#A2A2CC] mb-6">You don't have any tickets in this category right now.</p>
          <Link to="/search" className="inline-block bg-[#8B5CF6] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#7C3AED] transition-colors shadow-md">Browse Events</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReservations.map(res => (
            <div key={res.reservation_id} className="flex flex-col md:flex-row bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm overflow-hidden transition-all hover:shadow-md">
              
              <div className="flex-1 p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#8B5CF6] dark:text-[#B794F4] bg-[#8B5CF6]/10 px-3 py-1 rounded-full">{res.sport_type}</span>
                  <span className="text-sm font-bold text-[#6B7280] dark:text-[#A2A2CC]">Order #{res.reservation_id}</span>
                </div>
                <Link to={`/ticket/${res.ticket_id}`} className="group">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-[#FFFFFF] mb-1 group-hover:text-[#8B5CF6] dark:group-hover:text-[#B794F4] transition-colors">
                    {res.home_team} vs {res.away_team}
                  </h2>
                </Link>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-[#6B7280] dark:text-[#A2A2CC]">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                    {formatDate(res.ticket_date_time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    {res.venue_name}, {res.venue_city}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                    {res.quantity}x Tickets ({res.seat_info})
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[280px] shrink-0 bg-[#F9FAFB] dark:bg-[#1A1924] p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#E5E7EB] dark:border-[#2D2B3D]">
                <div>
                  <p className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC] mb-1 uppercase tracking-wider">Total</p>
                  <p className="text-3xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">${(res.price * res.quantity).toFixed(2)}</p>
                </div>
                
                <div className="mt-4 flex flex-col justify-end gap-3 min-h-[76px]">
                  {activeTab === 'Pending' && (
                    <>
                      <button 
                        onClick={() => navigate(`/checkout/${res.reservation_id}`)}
                        className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:scale-[1.02]"
                      >
                        Pay Now
                      </button>
                      <p className="text-xs text-center font-bold text-[#FF6E6E] animate-pulse">
                        <CountdownTimer reservationId={res.reservation_id} />
                      </p>
                    </>
                  )}
                  {activeTab === 'Confirmed' && (
                    <>
                      <button className="w-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-[#50FA7B]/10 dark:text-[#50FA7B] dark:border-[#50FA7B]/20 py-3 rounded-xl font-bold cursor-default">Ticket Valid</button>
                      <button onClick={() => openCancelModal(res)} className="w-full text-xs font-bold text-[#FF6E6E] hover:underline text-center">Request Cancellation</button>
                    </>
                  )}
                  {activeTab === 'Canceled & Expired' && (
                    <div className={`w-full flex items-center justify-center h-[50px] rounded-xl font-bold border-2 border-dashed ${
                      res.status === 'Expired' 
                        ? 'text-[#6B7280] bg-[#F3F4F6] border-[#D1D5DB] dark:text-[#A2A2CC] dark:bg-[#1A1924] dark:border-[#2D2B3D]'
                        : 'text-red-500 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/30'
                    }`}>
                      {res.status === 'Expired' ? 'Hold Expired' : 'Canceled'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCancelModalOpen} onClose={() => !isCanceling && setIsCancelModalOpen(false)} title="Cancel Ticket">
        {isFetchingPenalty ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#8B5CF6]">
            <svg className="animate-spin h-8 w-8 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="font-bold">Calculating policy rules...</p>
          </div>
        ) : penaltyInfo ? (
          <div className="space-y-6">
            <div className="bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 p-4 rounded-xl">
              <p className="text-[#FF6E6E] text-sm font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /></svg>
                Cancellation Policy
              </p>
              <p className="text-[#111827] dark:text-[#FFFFFF] text-sm">
                Based on how close this event is, a cancellation penalty applies. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-3 bg-[#F9FAFB] dark:bg-[#1A1924] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#2D2B3D]">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280] dark:text-[#A2A2CC]">Original Amount Paid</span>
                <span className="font-bold text-[#111827] dark:text-[#FFFFFF]">${penaltyInfo.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#FF6E6E]">Penalty Fee ({penaltyInfo.penalty_percent}%)</span>
                <span className="font-bold text-[#FF6E6E]">-${penaltyInfo.penalty_amount?.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#E5E7EB] dark:border-[#2D2B3D] pt-3 flex justify-between">
                <span className="font-bold text-[#111827] dark:text-[#FFFFFF]">Total Refund</span>
                <span className="font-extrabold text-[#50FA7B]">${penaltyInfo.refund_amount?.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-center font-medium text-[#6B7280] dark:text-[#A2A2CC]">
              Refunds will be credited back to your original payment method within 3-5 business days.
            </p>

            <button onClick={handleFinalCancel} disabled={isCanceling} className="w-full bg-[#FF6E6E] text-white py-3.5 rounded-xl font-bold hover:bg-red-500 transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
              {isCanceling ? 'Canceling Ticket...' : 'Confirm & Cancel Ticket'}
            </button>
          </div>
        ) : null}
      </Modal>

    </div>
  );
}