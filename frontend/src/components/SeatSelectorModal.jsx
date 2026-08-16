import { useState } from 'react';

export default function SeatSelectorModal({ isOpen, onClose, sportType, quantity, onConfirm }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  const zones = [
    { id: 'N-L-L', name: 'North Stand - Lower Left', points: '245,155 411,155 411,125 205,125' },
    { id: 'N-L-C', name: 'North Stand - VIP', points: '415,155 585,155 585,125 415,125' },
    { id: 'N-L-R', name: 'North Stand - Lower Right', points: '589,155 755,155 795,125 589,125' },
    { id: 'N-U-L', name: 'North Stand - Upper Left', points: '195,115 411,115 411,65 145,65' },
    { id: 'N-U-C', name: 'North Stand - Upper Center', points: '415,115 585,115 585,65 415,65' },
    { id: 'N-U-R', name: 'North Stand - Upper Right', points: '589,115 805,115 855,65 589,65' },
    
    { id: 'S-L-L', name: 'South Stand - Lower Left', points: '245,445 411,445 411,475 205,475' },
    { id: 'S-L-C', name: 'South Stand - VIP', points: '415,445 585,445 585,475 415,475' },
    { id: 'S-L-R', name: 'South Stand - Lower Right', points: '589,445 755,445 795,475 589,475' },
    { id: 'S-U-L', name: 'South Stand - Upper Left', points: '195,485 411,485 411,535 145,535' },
    { id: 'S-U-C', name: 'South Stand - Upper Center', points: '415,485 585,485 585,535 415,535' },
    { id: 'S-U-R', name: 'South Stand - Upper Right', points: '589,485 805,485 855,535 589,535' },
    
    { id: 'W-L-N', name: 'West Stand - Lower North', points: '235,165 235,298 205,298 205,135' },
    { id: 'W-L-S', name: 'West Stand - Lower South', points: '235,302 235,435 205,465 205,302' },
    { id: 'W-U-N', name: 'West Stand - Upper North', points: '195,125 195,298 145,298 145,75' },
    { id: 'W-U-S', name: 'West Stand - Upper South', points: '195,302 195,475 145,525 145,302' },
    
    { id: 'E-L-N', name: 'East Stand - Lower North', points: '765,165 765,298 795,298 795,135' },
    { id: 'E-L-S', name: 'East Stand - Lower South', points: '765,302 765,435 795,465 795,302' },
    { id: 'E-U-N', name: 'East Stand - Upper North', points: '805,125 805,298 855,298 855,75' },
    { id: 'E-U-S', name: 'East Stand - Upper South', points: '805,302 805,475 855,525 855,302' }
  ];

  const handleMouseMove = (e) => {
    if (hoveredZone) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const renderPitch = () => {
    const type = sportType?.toLowerCase() || '';

    if (type === 'basketball') {
      return (
        <g>
          <rect x="240" y="160" width="520" height="280" fill="#D97706" rx="8" />
          
          <line x1="500" y1="160" x2="500" y2="440" stroke="white" strokeWidth="3" opacity="0.8"/>
          <circle cx="500" cy="300" r="40" fill="none" stroke="white" strokeWidth="3" opacity="0.8"/>
          
          <rect x="240" y="210" width="120" height="180" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />
          <rect x="640" y="210" width="120" height="180" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />
          
          <path d="M 360 250 A 50 50 0 0 1 360 350" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />
          <path d="M 640 350 A 50 50 0 0 1 640 250" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />

          <path d="M 240 170 L 280 170 A 160 160 0 0 1 280 430 L 240 430" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />
          <path d="M 760 170 L 720 170 A 160 160 0 0 0 720 430 L 760 430" fill="none" stroke="white" strokeWidth="3" opacity="0.8" />
        </g>
      );
    }

    if (type === 'volleyball') {
      return (
        <g>
          <rect x="240" y="160" width="520" height="280" fill="#3B82F6" rx="8" />
          <rect x="340" y="190" width="320" height="220" fill="#EA580C" stroke="white" strokeWidth="4" />
          <line x1="500" y1="180" x2="500" y2="420" stroke="white" strokeWidth="6" />
          <line x1="440" y1="190" x2="440" y2="410" stroke="white" strokeWidth="3" opacity="0.9" />
          <line x1="560" y1="190" x2="560" y2="410" stroke="white" strokeWidth="3" opacity="0.9" />
        </g>
      );
    }

    return (
      <g>
        <rect x="240" y="160" width="520" height="280" fill="#22C55E" rx="12" />
        <rect x="290" y="160" width="50" height="280" fill="#16A34A" opacity="0.4" />
        <rect x="390" y="160" width="50" height="280" fill="#16A34A" opacity="0.4" />
        <rect x="490" y="160" width="50" height="280" fill="#16A34A" opacity="0.4" />
        <rect x="590" y="160" width="50" height="280" fill="#16A34A" opacity="0.4" />
        <rect x="690" y="160" width="50" height="280" fill="#16A34A" opacity="0.4" />
        
        <rect x="250" y="170" width="500" height="260" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
        <line x1="500" y1="170" x2="500" y2="430" stroke="white" strokeWidth="3" opacity="0.7" />
        <circle cx="500" cy="300" r="45" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
        
        <rect x="250" y="220" width="80" height="160" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
        <rect x="670" y="220" width="80" height="160" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
      </g>
    );
  };

  const displayString = selectedZone ? `${selectedZone} (x${quantity})` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#111827]/80 backdrop-blur-sm" onClick={onClose}></div>
      
      {hoveredZone && (
        <div 
          className="fixed z-[60] pointer-events-none bg-[#111827] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border border-white/20 whitespace-nowrap transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ 
            left: `${mousePos.x}px`, 
            top: `${mousePos.y - 15}px`
          }}
        >
          {hoveredZone}
        </div>
      )}

      <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-3xl w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden border border-[#E5E7EB] dark:border-[#2D2B3D] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-[#E5E7EB] dark:border-[#2D2B3D] flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">Seat Map</h2>
            <p className="text-[#6B7280] dark:text-[#A2A2CC] text-sm font-medium mt-1">Hover to view sections. Click to reserve.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F3F4F6] dark:hover:bg-[#1A1924] text-[#6B7280] dark:text-[#A2A2CC] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div 
          className="p-4 sm:p-8 flex justify-center items-center bg-[#F9FAFB] dark:bg-[#1A1924] overflow-hidden relative flex-1 min-h-[300px]"
          onMouseMove={handleMouseMove}
        >
          <svg viewBox="0 0 1000 600" className="w-full h-full max-h-[60vh] drop-shadow-2xl">
            {renderPitch()}

            {zones.map((zone) => (
              <polygon 
                key={zone.id}
                points={zone.points} 
                onClick={() => setSelectedZone(zone.name)}
                onMouseEnter={() => setHoveredZone(zone.name)}
                onMouseLeave={() => setHoveredZone(null)}
                strokeLinejoin="round"
                className={`cursor-pointer transition-all duration-300 stroke-[#FFFFFF] dark:stroke-[#1A1924] stroke-[4px]
                  ${selectedZone === zone.name 
                    ? 'fill-[#8B5CF6] hover:fill-[#7C3AED]' 
                    : 'fill-[#D1D5DB] dark:fill-[#4B5563] hover:fill-[#A78BFA] dark:hover:fill-[#8B5CF6]'
                  }
                `}
              />
            ))}
          </svg>
        </div>

        <div className="p-6 bg-[#FFFFFF] dark:bg-[#232130] border-t border-[#E5E7EB] dark:border-[#2D2B3D] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex-1 text-center sm:text-left">
            {selectedZone ? (
              <div>
                <p className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider mb-1">Current Selection</p>
                <p className="text-lg font-extrabold text-[#111827] dark:text-[#FFFFFF]">{displayString}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-[#6B7280] dark:text-[#A2A2CC] animate-pulse">Waiting for selection...</p>
            )}
          </div>
          
          <button 
            onClick={() => onConfirm(displayString)}
            disabled={!selectedZone}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            Select Seats
          </button>
        </div>

      </div>
    </div>
  );
}