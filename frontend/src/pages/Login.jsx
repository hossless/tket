import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    
    if (!identifier.trim() || !password.trim()) {
      setMessage("Please fill out all fields.");
      return;
    }

    setMessage("Authenticating...");

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login_identifier: identifier, 
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user.token); 
        setMessage("Login successful! Redirecting...");
        setTimeout(() => { navigate('/dashboard'); }, 1000);
      } else {
        setMessage(data.error || "Login failed.");
      }
    } catch (error) {
      setMessage("Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex justify-center items-center">
      
      <div className="w-96 p-8 rounded-2xl shadow-xl bg-[#FFFFFF] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] transition-colors duration-300">
        
        <h2 className="text-3xl font-bold mb-2 text-center text-[#111827] dark:text-[#FFFFFF]">
          Welcome Back
        </h2>
        
        <p className="text-sm text-center mb-6 text-[#6B7280] dark:text-[#A2A2CC]">
          Login to access your tickets.
        </p>

        <div className="min-h-[24px] mb-4">
          {message && (
            <p className={`text-center text-sm font-medium transition-opacity ${
              message.includes("successful") 
                ? "text-[#50FA7B]" 
                : "text-[#FF6E6E]" 
            }`}>
              {message}
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#111827] dark:text-[#FFFFFF]">
              Email, Phone, or Username
            </label>
            <input
              type="text"
              placeholder="user@example.com"
              className="w-full p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] dark:focus:ring-[#B794F4] transition-all"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[#111827] dark:text-[#FFFFFF]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full p-3 pr-10 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] dark:focus:ring-[#B794F4] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 p-3 rounded-lg font-bold text-white dark:text-[#1A1924] bg-[#8B5CF6] dark:bg-[#B794F4] hover:bg-[#7C3AED] dark:hover:bg-[#9F7AEA] transition-colors duration-200 shadow-md"
          >
            Login
          </button>
        </form>

      </div>
    </div>
  );
}