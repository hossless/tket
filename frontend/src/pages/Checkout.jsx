import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  const [form, setForm] = useState({
    cardNumber: '',
    cvv2: '',
    expMonth: '',
    expYear: '',
    secondPassword: ''
  });

  const handleChange = (field, maxLength) => (e) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= maxLength) {
      setForm(prev => ({ ...prev, [field]: val }));
    }
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 16) {
      setForm(prev => ({ ...prev, cardNumber: val }));
    }
  };

  useEffect(() => {
    const savedEndTime = sessionStorage.getItem(`tket_timer_end_${id}`);
    if (savedEndTime) {
      setTimeLeft(Math.max(0, Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000)));
    } else {
      const newEndTime = Date.now() + 600 * 1000;
      sessionStorage.setItem(`tket_timer_end_${id}`, newEndTime.toString());
    }

    const timer = setInterval(() => {
      const end = parseInt(sessionStorage.getItem(`tket_timer_end_${id}`), 10);
      setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const token = localStorage.getItem('tket_token');
        if (!token) return navigate('/login');

        const response = await fetch('http://localhost:8000/api/user/reservations/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Failed to load reservation.");
        
        const data = await response.json();
        const found = data.reservations.find(r => r.reservation_id.toString() === id);
        
        if (!found) throw new Error("Reservation not found.");
        if (found.status !== 'Pending') throw new Error("This ticket is already processed.");
        
        setReservation(found);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchReservation();
  }, [id, isAuthenticated, navigate]);

  const handleFinalPayment = async (e) => {
    e.preventDefault();

    if (form.cardNumber.length < 16) {
      alert("Please enter all 16 digits of your card.");
      return;
    }
    if (form.expMonth === '00' || parseInt(form.expMonth) > 12) {
      alert("Please enter a valid month (01-12)");
      return;
    }

    setIsPaying(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const token = localStorage.getItem('tket_token');
      const response = await fetch('http://localhost:8000/api/tickets/pay/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          reservation_id: parseInt(id),
          method: 'Credit Card'
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Payment failed at gateway.");

      navigate('/dashboard', { 
        state: { 
          targetTab: 'Confirmed',
          successMessage: `Payment successful! Tracking ID: ${data.tracking_code}` 
        } 
      });
    } catch (err) {
      alert(err.message);
      setIsPaying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#8B5CF6] animate-pulse text-2xl">Securing Checkout...</div>;
  if (error) return <div className="min-h-screen flex flex-col items-center justify-center"><p className="text-[#FF6E6E] font-bold text-xl mb-4">{error}</p><Link to="/dashboard" className="text-[#8B5CF6] hover:underline">Return to Dashboard</Link></div>;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const isExpired = timeLeft === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-[calc(100vh-73px)] flex items-center justify-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl shadow-xl border border-[#E5E7EB] dark:border-[#2D2B3D] overflow-hidden">
        
        <div className="bg-[#F9FAFB] dark:bg-[#1A1924] p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E5E7EB] dark:border-[#2D2B3D]">
          <div>
            <h2 className="text-sm font-extrabold text-[#8B5CF6] dark:text-[#B794F4] tracking-widest uppercase mb-6">Order Summary</h2>
            <h1 className="text-3xl font-extrabold text-[#111827] dark:text-[#FFFFFF] mb-2 leading-tight">
              {reservation.home_team} vs {reservation.away_team}
            </h1>
            <p className="text-[#6B7280] dark:text-[#A2A2CC] font-medium mb-8">
              {reservation.quantity}x Tickets • {reservation.seat_info}
            </p>

            <div className="space-y-4 pt-6 border-t border-[#E5E7EB] dark:border-[#2D2B3D]">
              <div className="flex justify-between text-[#6B7280] dark:text-[#A2A2CC] font-medium">
                <span>Subtotal</span>
                <span>${(reservation.price * reservation.quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280] dark:text-[#A2A2CC] font-medium">
                <span>Taxes & Fees</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF] pt-4">
                <span>Total</span>
                <span>${(reservation.price * reservation.quantity).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className={`mt-12 p-4 rounded-xl flex items-center justify-center gap-3 font-bold ${isExpired ? 'bg-red-50 text-red-500' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            {isExpired ? 'Hold Expired' : `Time Remaining: ${minutes}:${seconds}`}
          </div>
        </div>

        <div className="p-8 md:p-12">
          <h2 className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF] mb-8">Secure Payment Gateway</h2>
          
          <form onSubmit={handleFinalPayment} className="space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Card Number</label>
              <input 
                disabled={isExpired} required type="text" 
                value={form.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')} 
                onChange={handleCardNumberChange}
                maxLength="19" placeholder="0000 0000 0000 0000" 
                className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono tracking-widest disabled:opacity-50 text-center text-lg" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">CVV2</label>
                <input 
                  disabled={isExpired} required type="password" 
                  value={form.cvv2} onChange={handleChange('cvv2', 4)}
                  minLength="3" maxLength="4" placeholder="•••" 
                  className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono disabled:opacity-50 text-center text-lg" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Expiry Date</label>
                <div className="flex items-center gap-2">
                  <input 
                    disabled={isExpired} required type="text" 
                    value={form.expYear} onChange={handleChange('expYear', 2)}
                    minLength="2" maxLength="2" placeholder="YY" 
                    className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono text-center disabled:opacity-50 text-lg" 
                  />
                  <span className="text-xl text-[#9CA3AF]">/</span>
                  <input 
                    disabled={isExpired} required type="text" 
                    value={form.expMonth} onChange={handleChange('expMonth', 2)}
                    minLength="2" maxLength="2" placeholder="MM" 
                    className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono text-center disabled:opacity-50 text-lg" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Second Password / PIN</label>
              <input 
                disabled={isExpired} required type="password" 
                value={form.secondPassword} onChange={handleChange('secondPassword', 12)}
                minLength="4" maxLength="12" placeholder="••••" 
                className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none font-mono tracking-widest disabled:opacity-50 text-center text-lg" 
              />
            </div>

            <button 
              disabled={isPaying || isExpired} 
              type="submit" 
              className="w-full mt-6 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white py-4 rounded-xl font-extrabold transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
            >
              {isPaying ? (
                <><svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing Payment...</>
              ) : isExpired ? 'Hold Expired' : 'Confirm Payment'}
            </button>
            <Link to="/dashboard" className="block text-center text-sm font-bold text-[#6B7280] hover:text-[#111827] dark:hover:text-[#FFFFFF] mt-4">Cancel & Return</Link>
          </form>
        </div>

      </div>
    </div>
  );
}