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

  const initialTarget = location.state?.targetTab || 'Pending';
  const isProfileInit = initialTarget === 'Profile';

  const [activeSidebar, setActiveSidebar] = useState(isProfileInit ? 'Profile' : 'Tickets');
  const [activeTicketTab, setActiveTicketTab] = useState(isProfileInit ? 'Pending' : initialTarget);

  const [reservations, setReservations] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [isFetchingPenalty, setIsFetchingPenalty] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', username: '', phone_number: '', email: '', city: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [reportForm, setReportForm] = useState({ report_type: '', reservation_id: '', description: '' });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (successMsg) {
      window.history.replaceState({}, document.title); 
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (reportSuccess) {
      const timer = setTimeout(() => setReportSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [reportSuccess]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('tket_token');
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

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/user/profile/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileForm({
          first_name: data.user?.first_name || '',
          last_name: data.user?.last_name || '',
          username: data.user?.username || '',
          phone_number: data.user?.phone_number || '',
          email: data.user?.email || '',
          city: data.user?.city || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/user/reports/list/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('tket_token');
    
    if (!isAuthenticated || !token) {
      navigate('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'Spectator');
      } catch (err) {
        setUserRole('Spectator');
      }

      fetchProfile();
      fetchReservations();
      fetchReports();
    }
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
      setActiveTicketTab('Canceled & Expired');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    const payload = {};
    Object.keys(profileForm).forEach(key => {
      const val = profileForm[key]?.toString().trim() || '';
      if (val !== '') {
        payload[key] = val;
      }
    });

    if (Object.keys(payload).length === 0) {
      setProfileError("Please fill out at least one field to update.");
      setIsSavingProfile(false);
      return;
    }

    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/user/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile.");
      
      setProfileForm({
        first_name: data.user?.first_name || '',
        last_name: data.user?.last_name || '',
        username: data.user?.username || '',
        phone_number: data.user?.phone_number || '',
        email: data.user?.email || '',
        city: data.user?.city || ''
      });
      
      setProfileSuccess("Profile updated successfully!");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleReportChange = (e) => {
    setReportForm({ ...reportForm, [e.target.name]: e.target.value });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const token = localStorage.getItem('tket_token');
      const payload = {
        report_type: reportForm.report_type,
        description: reportForm.description
      };
      
      if (reportForm.reservation_id) {
        payload.reservation_id = reportForm.reservation_id;
      }

      const response = await fetch('http://localhost:8000/api/user/reports/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit report.");
      
      setReportSuccess("Report submitted successfully! Our team will review it shortly.");
      setReportForm({ report_type: '', reservation_id: '', description: '' });
      setIsCreatingReport(false);
      await fetchReports();
    } catch (err) {
      setReportError(err.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const getInitials = () => {
    const f = profileForm.first_name?.trim();
    const l = profileForm.last_name?.trim();
    const u = profileForm.username?.trim();
    
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f[0].toUpperCase();
    if (u) return u[0].toUpperCase();
    return 'U';
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTicketTab === 'Canceled & Expired') return res.status === 'Canceled' || res.status === 'Expired';
    return res.status === activeTicketTab;
  });
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#8B5CF6] animate-pulse text-2xl">Loading Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-[101vh]">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight">My Account</h1>
          <p className="text-[#6B7280] dark:text-[#A2A2CC] mt-2 font-medium">Manage your tickets, payments, and personal details.</p>
        </div>
        
        {(userRole === 'Admin' || userRole === 'Support') && (
          <Link 
            to="/admin" 
            className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" /></svg>
            Command Center
          </Link>
        )}
      </div>

      {successMsg && (
        <div className="mb-8 p-4 bg-[#50FA7B]/10 border border-[#50FA7B]/20 text-[#50FA7B] font-bold rounded-xl text-center shadow-sm animate-in fade-in slide-in-from-top-4">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => setActiveSidebar('Tickets')}
            className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${
              activeSidebar === 'Tickets' 
                ? 'bg-[#111827] text-white dark:bg-[#FFFFFF] dark:text-[#1A1924] shadow-md' 
                : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 7.125c0-1.036.84-1.875 1.875-1.875h6c1.036 0 1.875.84 1.875 1.875v3.75c0 1.036-.84 1.875-1.875 1.875h-6A1.875 1.875 0 0 1 1.5 10.875v-3.75Zm12 1.5c0-1.036.84-1.875 1.875-1.875h5.25c1.035 0 1.875.84 1.875 1.875v8.25c0 1.035-.84 1.875-1.875 1.875h-5.25a1.875 1.875 0 0 1-1.875-1.875v-8.25ZM3 16.125c0-1.036.84-1.875 1.875-1.875h5.25c1.036 0 1.875.84 1.875 1.875v2.25c0 1.035-.84 1.875-1.875 1.875h-5.25A1.875 1.875 0 0 1 3 18.375v-2.25Z" clipRule="evenodd" /></svg>
            My Tickets
          </button>
          
          <button 
            onClick={() => setActiveSidebar('Profile')}
            className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${
              activeSidebar === 'Profile' 
                ? 'bg-[#111827] text-white dark:bg-[#FFFFFF] dark:text-[#1A1924] shadow-md' 
                : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
            Profile Settings
          </button>

          <button 
            onClick={() => setActiveSidebar('Reports')}
            className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${
              activeSidebar === 'Reports' 
                ? 'bg-[#111827] text-white dark:bg-[#FFFFFF] dark:text-[#1A1924] shadow-md' 
                : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" /></svg>
            Support & Reports
          </button>
        </div>

        <div className="flex-1 w-full min-h-[600px]">
          {activeSidebar === 'Tickets' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex gap-8 border-b border-[#E5E7EB] dark:border-[#2D2B3D] mb-8 overflow-x-auto scrollbar-hide">
                {['Pending', 'Confirmed', 'Canceled & Expired'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTicketTab(tab)}
                    className={`pb-4 px-2 whitespace-nowrap font-bold text-sm transition-all duration-300 relative ${
                      activeTicketTab === tab ? 'text-[#8B5CF6] dark:text-[#B794F4]' : 'text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#111827] dark:hover:text-[#FFFFFF]'
                    }`}
                  >
                    {tab} 
                    {activeTicketTab === tab && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#8B5CF6] dark:bg-[#B794F4] rounded-t-lg"></span>}
                  </button>
                ))}
              </div>

              {error && <div className="mb-8 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] font-bold rounded-xl">{error}</div>}

              {filteredReservations.length === 0 ? (
                <div className="py-20 text-center bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm animate-in fade-in zoom-in-95 duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-[#9CA3AF] dark:text-[#6B7280] mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                  </svg>
                  <h3 className="text-xl font-bold text-[#111827] dark:text-[#FFFFFF] mb-2">No {activeTicketTab.toLowerCase()} tickets</h3>
                  <p className="text-[#6B7280] dark:text-[#A2A2CC] mb-6">You don't have any tickets in this category right now.</p>
                  <Link to="/search" className="inline-block bg-[#8B5CF6] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#7C3AED] transition-colors shadow-md">Browse Events</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReservations.map(res => (
                    <div key={res.reservation_id} className="flex flex-col md:flex-row bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                      
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
                          {activeTicketTab === 'Pending' && (
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
                          {activeTicketTab === 'Confirmed' && (
                            <>
                              <button className="w-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-[#50FA7B]/10 dark:text-[#50FA7B] dark:border-[#50FA7B]/20 py-3 rounded-xl font-bold cursor-default">Ticket Valid</button>
                              <button onClick={() => openCancelModal(res)} className="w-full text-xs font-bold text-[#FF6E6E] hover:underline text-center">Request Cancellation</button>
                            </>
                          )}
                          {activeTicketTab === 'Canceled & Expired' && (
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
            </div>
          )}

          {activeSidebar === 'Profile' && (
            <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col items-center mb-10">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-white flex items-center justify-center text-4xl font-extrabold shadow-lg mb-4 ring-4 ring-[#8B5CF6]/20">
                  {getInitials()}
                </div>
                <h2 className="text-xl font-bold text-[#111827] dark:text-[#FFFFFF]">
                  {profileForm.first_name || profileForm.last_name ? `${profileForm.first_name} ${profileForm.last_name}` : `@${profileForm.username || 'user'}`}
                </h2>
                <p className="text-sm text-[#6B7280] dark:text-[#A2A2CC]">{profileForm.email || 'Update your details below'}</p>
              </div>

              {profileError && <div className="mb-6 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] font-bold rounded-xl text-sm">{profileError}</div>}
              {profileSuccess && <div className="mb-6 p-4 bg-[#50FA7B]/10 border border-[#50FA7B]/20 text-[#50FA7B] font-bold rounded-xl text-sm">{profileSuccess}</div>}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">First Name</label>
                    <input type="text" name="first_name" value={profileForm.first_name} onChange={handleProfileChange} placeholder="e.g. John" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Last Name</label>
                    <input type="text" name="last_name" value={profileForm.last_name} onChange={handleProfileChange} placeholder="e.g. Doe" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Username</label>
                    <input type="text" name="username" value={profileForm.username} onChange={handleProfileChange} placeholder="e.g. jdoe99" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" name="email" value={profileForm.email} onChange={handleProfileChange} placeholder="john@example.com" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Phone Number</label>
                    <input type="text" name="phone_number" value={profileForm.phone_number} onChange={handleProfileChange} placeholder="+1234567890" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">City</label>
                    <input type="text" name="city" value={profileForm.city} onChange={handleProfileChange} placeholder="e.g. Tehran" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button disabled={isSavingProfile} type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-70 flex justify-center items-center gap-2">
                    {isSavingProfile ? (
                      <><svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSidebar === 'Reports' && (
            <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              {reportError && <div className="mb-6 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] font-bold rounded-xl text-sm">{reportError}</div>}
              {reportSuccess && <div className="mb-6 p-4 bg-[#50FA7B]/10 border border-[#50FA7B]/20 text-[#50FA7B] font-bold rounded-xl text-sm">{reportSuccess}</div>}

              {!isCreatingReport ? (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF] mb-1">My Reports</h2>
                      <p className="text-sm text-[#6B7280] dark:text-[#A2A2CC]">Track the status of your support requests.</p>
                    </div>
                    <button 
                      onClick={() => setIsCreatingReport(true)} 
                      className="px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)] flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
                      New Report
                    </button>
                  </div>

                  {reports.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-[#E5E7EB] dark:border-[#2D2B3D] rounded-2xl">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-[#9CA3AF] dark:text-[#6B7280] mb-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                      <h3 className="text-lg font-bold text-[#111827] dark:text-[#FFFFFF] mb-1">No reports found</h3>
                      <p className="text-sm text-[#6B7280] dark:text-[#A2A2CC]">You haven't submitted any support requests yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report, idx) => (
                        <div key={idx} className="p-5 border border-[#E5E7EB] dark:border-[#2D2B3D] rounded-2xl flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">{report.report_type}</span>
                                {report.reservation_id && (
                                  <span className="text-xs font-semibold text-[#6B7280] dark:text-[#A2A2CC] bg-[#F3F4F6] dark:bg-[#1A1924] px-2 py-0.5 rounded-md">
                                    Order #{report.reservation_id}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-[#111827] dark:text-[#FFFFFF] font-medium text-sm leading-relaxed break-words">{report.description}</h4>
                            </div>
                            <div className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap border ${
                              report.report_status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-[#50FA7B]/10 dark:text-[#50FA7B] dark:border-[#50FA7B]/20'
                                : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB] dark:bg-[#1A1924] dark:text-[#A2A2CC] dark:border-[#2D2B3D]'
                            }`}>
                              {report.report_status || 'Waiting'}
                            </div>
                          </div>
                          
                          {report.reply && (
                            <div className="mt-2 p-4 bg-[#F9FAFB] dark:bg-[#1A1924] rounded-xl border-l-4 border-[#8B5CF6]">
                              <p className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h1.5v3.662c0 .484.58.745.941.428L11.531 18H19.5a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3H4.5ZM18.75 9a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 .75-.75ZM15.75 12.75a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0 0 1.5h8.25a.75.75 0 0 0 .75-.75Z" clipRule="evenodd" />
                                </svg>
                                Support Reply
                              </p>
                              <p className="text-sm text-[#111827] dark:text-[#FFFFFF]">{report.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <button 
                      onClick={() => setIsCreatingReport(false)}
                      className="p-2 bg-[#F3F4F6] dark:bg-[#1A1924] rounded-full text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2B3D] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" /></svg>
                    </button>
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">Submit a Report</h2>
                      <p className="text-sm text-[#6B7280] dark:text-[#A2A2CC]">Having trouble with a ticket or payment? Let us know.</p>
                    </div>
                  </div>

                  <form onSubmit={handleReportSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Report Category</label>
                      <select required name="report_type" value={reportForm.report_type} onChange={handleReportChange} className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none appearance-none">
                        <option value="">Select a category...</option>
                        <option value="General">General</option>
                        <option value="Technical">Technical</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Refund">Refund</option>
                        <option value="Bug">Bug</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Related Ticket (Optional)</label>
                      <select name="reservation_id" value={reportForm.reservation_id} onChange={handleReportChange} className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none appearance-none">
                        <option value="">None (General Inquiry)</option>
                        {reservations.map(res => (
                          <option key={res.reservation_id} value={res.reservation_id}>
                            Order #{res.reservation_id} - {res.home_team} vs {res.away_team}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Message</label>
                      <textarea required maxLength="2000" name="description" value={reportForm.description} onChange={handleReportChange} rows="5" placeholder="Please describe the issue in detail..." className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none resize-none"></textarea>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button disabled={isSubmittingReport} type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-70 flex justify-center items-center gap-2">
                        {isSubmittingReport ? (
                          <><svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Submitting...</>
                        ) : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

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