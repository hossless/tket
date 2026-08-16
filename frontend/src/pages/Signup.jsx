import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Signup() {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsMounted(true), 50);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    contact_info: '',
    password: ''
  });
  
  const [otp, setOtp] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          contact_info: formData.contact_info.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_info: formData.contact_info.trim(),
          otp: otp.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          setStep(1); 
          setOtp('');
        }
        throw new Error(data.error || 'Invalid OTP.');
      }

      login(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className={`w-full max-w-md bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl border border-[#E5E7EB] dark:border-[#2D2B3D] shadow-xl p-8 sm:p-10 transition-all duration-700 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-[#FFFFFF]">
            {step === 1 ? 'Create an account' : 'Verify your account'}
          </h2>
          <p className="text-sm text-[#6B7280] dark:text-[#A2A2CC] mt-2">
            {step === 1 
              ? 'Enter your details below to get started.' 
              : `We sent a 6-digit code to ${formData.contact_info}`
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF6E6E]/10 border border-[#FF6E6E]/20 text-[#FF6E6E] text-sm font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={handleInputChange} 
                required 
                placeholder="e.g. tket_fan99" 
                className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Email or Phone</label>
              <input 
                type="text" 
                name="contact_info" 
                value={formData.contact_info} 
                onChange={handleInputChange} 
                required 
                placeholder="name@example.com or +1234567890" 
                className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                required 
                placeholder="••••••••" 
                className="w-full p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:ring-2 focus:ring-[#8B5CF6] outline-none transition-all tracking-widest font-mono"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white py-3.5 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Send Security Code'}
            </button>
            
            <p className="text-center text-sm font-medium text-[#6B7280] dark:text-[#A2A2CC] pt-4">
              Already have an account? <Link to="/login" className="text-[#8B5CF6] hover:text-[#7C3AED] font-bold transition-colors">Log in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#6B7280] dark:text-[#A2A2CC] uppercase tracking-wider mb-3 text-center">Enter 6-Digit Code</label>
              <input 
                type="text" 
                maxLength="6"
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                required 
                autoFocus
                placeholder="000000" 
                className="w-full p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#1A1924] border-2 border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/20 outline-none transition-all text-center text-3xl tracking-[0.5em] font-mono font-extrabold placeholder:opacity-30"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.length < 6}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white py-3.5 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Verify & Create Account'}
            </button>

            <button 
              type="button"
              onClick={() => { setStep(1); setOtp(''); setError(null); }}
              className="w-full text-center text-sm font-bold text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors"
            >
              Change email/phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}