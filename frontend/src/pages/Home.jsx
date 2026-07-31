import React from 'react';

function OptionC_StartupSplit() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A1924', fontFamily: 'Inter, sans-serif' }}>
      


      <div className="grid md:grid-cols-2 gap-10 items-center px-10 py-20 max-w-7xl mx-auto">
        
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }} className="text-6xl font-extrabold text-white mb-6 leading-tight tracking-tighter">
            Secure seats in <br /> 
            <span style={{ 
              color: '#B794F4', 
              textShadow: '0 0 30px rgba(183, 148, 244, 0.4)'
            }}>milliseconds.</span>
          </h1>
          <p className="text-[#A2A2CC] text-xl mb-10 max-w-md">The high-performance platform for true sports fans. Fast search. Instant booking.</p>
          <div className="flex gap-4">
            <button className="px-8 py-3 rounded-lg font-semibold text-black transition" style={{ backgroundColor: '#B794F4' }}>View All Matches</button>
            <button className="px-8 py-3 rounded-lg border border-[#2D2B3D] text-[#F8F8F2] hover:border-white transition">Browse Sports</button>
          </div>
        </div>

        <div className="relative h-96 flex items-center justify-center">
          <div className="absolute w-80 h-48 border-2 border-[#B794F4] rounded-2xl p-6" style={{ backgroundColor: '#232130', transform: 'rotateX(10deg) rotateY(-10deg) rotateZ(-2deg)', boxShadow: '0 20px 50px rgba(15, 14, 23, 0.8)' }}>
             <div className="w-10 h-10 rounded-full mb-3" style={{backgroundColor: '#1A1924'}}></div>
             <div className="h-4 w-3/4 bg-[#2D2B3D] rounded mb-2"></div>
             <div className="h-3 w-1/2 bg-[#1A1924] rounded"></div>
          </div>
          <div className="absolute w-80 h-48 rounded-2xl opacity-40 border border-[#2D2B3D]" style={{ backgroundColor: '#1A1924', transform: 'translate(40px, -40px) rotateX(10deg) rotateY(-10deg) rotateZ(5deg)' }}></div>
          <div className="absolute w-80 h-48 rounded-2xl opacity-20 border border-[#2D2B3D]" style={{ backgroundColor: '#1A1924', transform: 'translate(80px, -80px) rotateX(10deg) rotateY(-10deg) rotateZ(10deg)' }}></div>
        </div>

      </div>

      <div className="p-10 text-[#2D2B3D] text-center text-sm border-t border-[#2D2B3D]">Scrolling down reveals the filter bar & actual grid...</div>
    </div>
  );
}

export default OptionC_StartupSplit;