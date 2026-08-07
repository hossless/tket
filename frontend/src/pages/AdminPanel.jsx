import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AdminPanel() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Reservations');
  const [reservations, setReservations] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resPage, setResPage] = useState(1);
  const resPerPage = 10;

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialTicketForm = {
    sport_type: 'Football',
    home_team: '',
    away_team: '',
    ticket_date_time: '',
    venue_city: '',
    price: '',
    total_capacity: '',
    category: 'Normal',
    organizer: '',
    tournament_name: '',
    venue_name: '',
    facilities: ''
  };
  
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/admin/dashboard/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        navigate('/dashboard');
        return;
      }
      
      if (!response.ok) throw new Error("Failed to load admin data.");
      const data = await response.json();
      setReservations(data.reservations);
      setReports(data.reports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchDashboardData();
    }
  }, [isAuthenticated, navigate]);

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/admin/manage/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          target_type: 'reservation',
          target_id: reservationId,
          status: newStatus
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update reservation.");
      }

      setReservations(reservations.map(res => 
        res.reservation_id === reservationId ? { ...res, reservation_status: newStatus } : res
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  const openReplyModal = (report) => {
    setSelectedReport(report);
    setReplyText('');
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/admin/manage/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          target_type: 'report',
          target_id: selectedReport.report_id,
          status: 'Resolved',
          reply: replyText
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit reply.");
      }

      setReports(reports.map(rep => 
        rep.report_id === selectedReport.report_id 
          ? { ...rep, report_status: 'Resolved', reply: replyText } 
          : rep
      ));
      setReplyModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketChange = (e) => {
    setTicketForm({ ...ticketForm, [e.target.name]: e.target.value });
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketForm.ticket_date_time) {
      setCreateError("Please select a date and time for the event.");
      return;
    }

    setIsCreatingTicket(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/admin/tickets/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(ticketForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create ticket.");
      }

      setCreateSuccess(`Event successfully created with ID #${data.ticket_id}!`);
      setTicketForm(initialTicketForm);
      
      setTimeout(() => setCreateSuccess(null), 5000);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const indexOfLastRes = resPage * resPerPage;
  const indexOfFirstRes = indexOfLastRes - resPerPage;
  const currentReservations = reservations.slice(indexOfFirstRes, indexOfLastRes);
  const totalPages = Math.ceil(reservations.length / resPerPage);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#8B5CF6] animate-pulse text-2xl">Loading Control Center...</div>;

  return (
    <>
      <style>{`
        /* Global DatePicker Overrides to Match Theme */
        .react-datepicker { font-family: inherit; border-radius: 0.75rem; border-color: #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: #FFFFFF; }
        .react-datepicker__header { background-color: #F9FAFB; border-bottom-color: #E5E7EB; border-top-left-radius: 0.75rem !important; border-top-right-radius: 0.75rem !important; }
        .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker-time__header { color: #111827; }
        .react-datepicker__day { color: #4B5563; }
        .react-datepicker__day:hover { background-color: #F3F4F6; border-radius: 8px; color: #111827; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background-color: #8B5CF6 !important; color: white !important; border-radius: 8px; }
        .react-datepicker__day--disabled { color: #D1D5DB; }
        
        /* Time Picker Specifics */
        .react-datepicker__time-container { border-left-color: #E5E7EB; }
        .react-datepicker__time { background-color: #FFFFFF !important; border-bottom-right-radius: 0.75rem; }
        .react-datepicker__time-list-item { color: #4B5563; }
        .react-datepicker__time-list-item:hover { background-color: #F3F4F6 !important; color: #111827 !important; }
        .react-datepicker__time-list-item--selected { background-color: #8B5CF6 !important; color: white !important; font-weight: bold; }
        
        /* Dark Mode Overrides */
        .dark .react-datepicker { background-color: #232130; border-color: #2D2B3D; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); }
        .dark .react-datepicker__header { background-color: #1A1924; border-bottom-color: #2D2B3D; }
        .dark .react-datepicker__current-month, .dark .react-datepicker__day-name, .dark .react-datepicker-time__header { color: #FFFFFF; }
        .dark .react-datepicker__day { color: #A2A2CC; }
        .dark .react-datepicker__day:hover { background-color: #2D2B3D; border-radius: 8px; color: #FFFFFF; }
        .dark .react-datepicker__day--disabled { color: #4B5563; }
        .dark .react-datepicker__time-container { border-left-color: #2D2B3D; }
        .dark .react-datepicker__time { background-color: #232130 !important; }
        .dark .react-datepicker__time-list-item { color: #A2A2CC !important; }
        .dark .react-datepicker__time-list-item:hover { background-color: #2D2B3D !important; color: #FFFFFF !important; }
        
        /* Layout Fixes */
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-12 min-h-[101vh]">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight">Command Center</h1>
          <p className="text-[#6B7280] dark:text-[#A2A2CC] mt-2 font-medium">System overview and ticket management.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('Reservations')}
              className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${
                activeTab === 'Reservations' 
                  ? 'bg-[#111827] text-white dark:bg-[#FFFFFF] dark:text-[#1A1924] shadow-md' 
                  : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 7.125c0-1.036.84-1.875 1.875-1.875h6c1.036 0 1.875.84 1.875 1.875v3.75c0 1.036-.84 1.875-1.875 1.875h-6A1.875 1.875 0 0 1 1.5 10.875v-3.75Zm12 1.5c0-1.036.84-1.875 1.875-1.875h5.25c1.035 0 1.875.84 1.875 1.875v8.25c0 1.035-.84 1.875-1.875 1.875h-5.25a1.875 1.875 0 0 1-1.875-1.875v-8.25ZM3 16.125c0-1.036.84-1.875 1.875-1.875h5.25c1.036 0 1.875.84 1.875 1.875v2.25c0 1.035-.84 1.875-1.875 1.875h-5.25A1.875 1.875 0 0 1 3 18.375v-2.25Z" clipRule="evenodd" /></svg>
              Reservations
            </button>
            
            <button 
              onClick={() => setActiveTab('Reports')}
              className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${
                activeTab === 'Reports' 
                  ? 'bg-[#111827] text-white dark:bg-[#FFFFFF] dark:text-[#1A1924] shadow-md' 
                  : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z" clipRule="evenodd" /></svg>
              Support Reports
            </button>

            <button 
              onClick={() => setActiveTab('CreateEvent')}
              className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-3 ${
                activeTab === 'CreateEvent' 
                  ? 'bg-[#8B5CF6] text-white shadow-md' 
                  : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#F3F4F6] dark:hover:bg-[#2D2B3D]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
              Create Event
            </button>
          </div>

          <div className="flex-1 w-full min-h-[600px]">
            {error && <div className="mb-8 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] font-bold rounded-xl">{error}</div>}

            {activeTab === 'Reservations' && (
              <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] dark:bg-[#1A1924] border-b border-[#E5E7EB] dark:border-[#2D2B3D]">
                        <th className="p-4 text-left text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider">Order ID</th>
                        <th className="p-4 text-left text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider">User</th>
                        <th className="p-4 text-left text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider">Match</th>
                        <th className="p-4 text-center text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider">Quantity</th>
                        <th className="p-4 text-left text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider">Date</th>
                        <th className="p-4 text-center text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2D2B3D]">
                      {currentReservations.map((res) => (
                        <tr key={res.reservation_id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#1A1924] transition-colors">
                          <td className="p-4 text-left text-sm font-bold text-[#111827] dark:text-[#FFFFFF]">#{res.reservation_id}</td>
                          <td className="p-4 text-left text-sm font-medium text-[#6B7280] dark:text-[#A2A2CC]">@{res.username}</td>
                          <td className="p-4 text-left text-sm font-bold text-[#111827] dark:text-[#FFFFFF] whitespace-nowrap">{res.home_team} vs {res.away_team}</td>
                          <td className="p-4 text-center text-sm font-medium text-[#6B7280] dark:text-[#A2A2CC]">{res.quantity}</td>
                          <td className="p-4 text-left text-sm font-medium text-[#6B7280] dark:text-[#A2A2CC] whitespace-nowrap">{formatDate(res.reserved_at)}</td>
                          <td className="p-4 text-center">
                            <select 
                              value={res.reservation_status} 
                              onChange={(e) => handleStatusChange(res.reservation_id, e.target.value)}
                              className={`w-[110px] px-2 py-1.5 rounded-lg text-xs font-bold outline-none border cursor-pointer text-center appearance-none ${
                                res.reservation_status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-[#50FA7B]/10 dark:text-[#50FA7B] dark:border-[#50FA7B]/20' :
                                res.reservation_status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                              }`}
                            >
                              <option className="bg-[#FFFFFF] text-[#111827] dark:bg-[#1A1924] dark:text-[#FFFFFF] font-medium" value="Pending">Pending</option>
                              <option className="bg-[#FFFFFF] text-[#111827] dark:bg-[#1A1924] dark:text-[#FFFFFF] font-medium" value="Confirmed">Confirmed</option>
                              <option className="bg-[#FFFFFF] text-[#111827] dark:bg-[#1A1924] dark:text-[#FFFFFF] font-medium" value="Canceled">Canceled</option>
                              <option className="bg-[#FFFFFF] text-[#111827] dark:bg-[#1A1924] dark:text-[#FFFFFF] font-medium" value="Expired">Expired</option>
                              <option className="bg-[#FFFFFF] text-[#111827] dark:bg-[#1A1924] dark:text-[#FFFFFF] font-medium" value="Failed">Failed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-[#E5E7EB] dark:border-[#2D2B3D] bg-[#F9FAFB] dark:bg-[#1A1924]">
                    <button 
                      onClick={() => setResPage(p => Math.max(1, p - 1))}
                      disabled={resPage === 1}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2B3D] transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-[#6B7280] dark:text-[#A2A2CC]">
                      Page {resPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setResPage(p => Math.min(totalPages, p + 1))}
                      disabled={resPage === totalPages}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-[#6B7280] dark:text-[#A2A2CC] hover:bg-[#E5E7EB] dark:hover:bg-[#2D2B3D] transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Reports' && (
              <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm p-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.report_id} className="p-5 border border-[#E5E7EB] dark:border-[#2D2B3D] rounded-2xl flex flex-col gap-4 hover:shadow-md transition-shadow bg-[#F9FAFB] dark:bg-[#1A1924]">
                      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">{report.report_type}</span>
                            <span className="text-xs font-medium text-[#6B7280] dark:text-[#A2A2CC]">by @{report.username}</span>
                            {report.reservation_id && (
                              <span className="text-xs font-semibold text-[#6B7280] dark:text-[#A2A2CC] bg-[#FFFFFF] dark:bg-[#232130] px-2 py-0.5 rounded-md border border-[#E5E7EB] dark:border-[#2D2B3D]">
                                Order #{report.reservation_id}
                              </span>
                            )}
                          </div>
                          <h4 className="text-[#111827] dark:text-[#FFFFFF] font-medium text-sm leading-relaxed">{report.description}</h4>
                        </div>
                        
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <div className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap border ${
                            report.report_status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-[#50FA7B]/10 dark:text-[#50FA7B] dark:border-[#50FA7B]/20'
                              : 'bg-[#E5E7EB] text-[#4B5563] border-[#D1D5DB] dark:bg-[#2D2B3D] dark:text-[#A2A2CC] dark:border-[#4B5563]'
                          }`}>
                            {report.report_status}
                          </div>
                          {report.report_status === 'Waiting' && (
                            <button 
                              onClick={() => openReplyModal(report)}
                              className="mt-1 px-4 py-1.5 bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 rounded-lg text-xs font-bold transition-colors"
                            >
                              Reply & Resolve
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {report.reply && (
                        <div className="mt-2 p-4 bg-[#FFFFFF] dark:bg-[#232130] rounded-xl border-l-4 border-[#8B5CF6] shadow-sm">
                          <p className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h1.5v3.662c0 .484.58.745.941.428L11.531 18H19.5a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3H4.5ZM18.75 9a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 .75-.75ZM15.75 12.75a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0 0 1.5h8.25a.75.75 0 0 0 .75-.75Z" clipRule="evenodd" /></svg>
                            Admin Reply
                          </p>
                          <p className="text-sm text-[#111827] dark:text-[#FFFFFF]">{report.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-12 text-[#6B7280] dark:text-[#A2A2CC] font-medium">No reports found.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'CreateEvent' && (
              <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">Create New Event</h2>
                  <p className="text-sm text-[#6B7280] dark:text-[#A2A2CC] mt-1">Publish a new ticket to the live database and Elasticsearch.</p>
                </div>

                {createError && <div className="mb-6 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] font-bold rounded-xl text-sm">{createError}</div>}
                {createSuccess && <div className="mb-6 p-4 bg-[#50FA7B]/10 border border-[#50FA7B]/20 text-[#50FA7B] font-bold rounded-xl text-sm">{createSuccess}</div>}

                <form onSubmit={handleTicketSubmit} className="space-y-8">
                  
                  <div>
                    <h3 className="text-lg font-bold text-[#111827] dark:text-[#FFFFFF] mb-4 border-b border-[#E5E7EB] dark:border-[#2D2B3D] pb-2">1. Match Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Sport Type</label>
                        <select name="sport_type" value={ticketForm.sport_type} onChange={handleTicketChange} required className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none">
                          <option value="Football">Football</option>
                          <option value="Basketball">Basketball</option>
                          <option value="Volleyball">Volleyball</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Tournament / League</label>
                        <input type="text" name="tournament_name" value={ticketForm.tournament_name} onChange={handleTicketChange} placeholder="e.g. Premier League" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Home Team</label>
                        <input type="text" name="home_team" value={ticketForm.home_team} onChange={handleTicketChange} required placeholder="e.g. Man City" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Away Team</label>
                        <input type="text" name="away_team" value={ticketForm.away_team} onChange={handleTicketChange} required placeholder="e.g. Man United" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#111827] dark:text-[#FFFFFF] mb-4 border-b border-[#E5E7EB] dark:border-[#2D2B3D] pb-2">2. Venue & Schedule</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Venue Name</label>
                        <input type="text" name="venue_name" value={ticketForm.venue_name} onChange={handleTicketChange} placeholder="e.g. Ettihad Stadium" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">City</label>
                        <input type="text" name="venue_city" value={ticketForm.venue_city} onChange={handleTicketChange} required placeholder="e.g. Madrid" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Date & Time</label>
                        <DatePicker
                          selected={ticketForm.ticket_date_time ? new Date(ticketForm.ticket_date_time) : null}
                          onChange={(date) => setTicketForm({ ...ticketForm, ticket_date_time: date ? date.toISOString() : '' })}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="MMMM d, yyyy h:mm aa"
                          placeholderText="Select date and time"
                          className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm shadow-sm placeholder-[#9CA3AF] dark:placeholder-[#6B7280]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Facilities</label>
                        <input type="text" name="facilities" value={ticketForm.facilities} onChange={handleTicketChange} placeholder="e.g. VIP Lounge, Free Wifi" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#111827] dark:text-[#FFFFFF] mb-4 border-b border-[#E5E7EB] dark:border-[#2D2B3D] pb-2">3. Ticket Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Category</label>
                        <select name="category" value={ticketForm.category} onChange={handleTicketChange} required className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none">
                          <option value="VIP">VIP</option>
                          <option value="Normal">Normal</option>
                          <option value="Economy">Economy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Total Capacity</label>
                        <input type="number" min="1" name="total_capacity" value={ticketForm.total_capacity} onChange={handleTicketChange} required placeholder="e.g. 5000" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Price ($)</label>
                        <input type="number" step="0.01" min="0" name="price" value={ticketForm.price} onChange={handleTicketChange} required placeholder="e.g. 150.00" className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono text-[#8B5CF6] dark:text-[#B794F4]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button disabled={isCreatingTicket} type="submit" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-70 flex justify-center items-center gap-2">
                      {isCreatingTicket ? (
                        <><svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Publishing Event...</>
                      ) : 'Publish New Event'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        <Modal isOpen={replyModalOpen} onClose={() => !isSubmitting && setReplyModalOpen(false)} title="Reply to Report">
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <div className="bg-[#F9FAFB] dark:bg-[#1A1924] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#2D2B3D]">
              <p className="text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] mb-1">User's Message:</p>
              <p className="text-sm text-[#111827] dark:text-[#FFFFFF]">{selectedReport?.description}</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Your Reply</label>
              <textarea 
                required 
                rows="4" 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type the official admin response here..." 
                className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none resize-none"
              ></textarea>
            </div>

            <div className="pt-2 flex justify-end">
              <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto px-6 py-3 bg-[#111827] dark:bg-[#FFFFFF] text-white dark:text-[#1A1924] rounded-xl font-bold hover:bg-[#374151] dark:hover:bg-[#E5E7EB] transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                {isSubmitting ? 'Resolving...' : 'Send Reply & Resolve'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}