import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#111827]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-[#FFFFFF] dark:bg-[#232130] w-full max-w-md rounded-3xl shadow-2xl border border-[#E5E7EB] dark:border-[#2D2B3D] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-[#E5E7EB] dark:border-[#2D2B3D]">
          <h2 className="text-xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors bg-[#F3F4F6] dark:bg-[#1A1924] p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-hide">
          {children}
        </div>

      </div>
    </div>
  );
}