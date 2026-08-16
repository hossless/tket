import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center px-4 text-center animate-in fade-in zoom-in duration-500">
      <h1 className="text-9xl font-extrabold text-[#8B5CF6] tracking-tighter mb-4 opacity-30">
        404
      </h1>
      <h2 className="text-3xl font-bold text-[#111827] dark:text-[#FFFFFF] mb-4">
        Whoops! You're offside.
      </h2>
      <p className="text-[#6B7280] dark:text-[#A2A2CC] mb-8 max-w-md mx-auto font-medium">
        The page or ticket you are looking for doesn't exist, has been moved, or is currently unavailable.
      </p>
      <Link 
        to="/" 
        className="px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)] inline-flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
        Back to Home
      </Link>
    </div>
  );
}