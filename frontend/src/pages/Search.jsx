import ReactSlider from 'react-slider';
import DatePicker from 'react-datepicker';
import { useState, useEffect } from 'react';
import TicketCard from '../components/TicketCard';
import { useSearchParams } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [draftSearch, setDraftSearch] = useState(searchParams.get('q') || '');
  const [draftSport, setDraftSport] = useState(searchParams.get('sport_type') || '');
  const [draftCategory, setDraftCategory] = useState(searchParams.get('category') || 'Any');
  const [draftStartDate, setDraftStartDate] = useState(searchParams.get('start_date') || '');
  const [draftEndDate, setDraftEndDate] = useState(searchParams.get('end_date') || '');
  const [draftIncludeSoldOut, setDraftIncludeSoldOut] = useState(searchParams.get('include_sold_out') === 'true');
  const [draftShowPast, setDraftShowPast] = useState(searchParams.get('show_past') === 'true');
  const [draftSort, setDraftSort] = useState(searchParams.get('sort_by') || 'date_asc');
  const [draftLimit, setDraftLimit] = useState(searchParams.get('limit') || '12');  
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('min_price')) || 0,
    Number(searchParams.get('max_price')) || 500
  ]);

  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const url = new URL('http://localhost:8000/api/tickets/search/');
        
        searchParams.forEach((value, key) => {
          if (value && value !== 'Any' && key !== 'include_sold_out') {
            url.searchParams.append(key, value);
          }
        });

        if (searchParams.get('include_sold_out') !== 'true') {
          url.searchParams.append('exclude_sold_out', 'true');
        }

        if (!searchParams.has('limit')) url.searchParams.append('limit', draftLimit);
        if (!searchParams.has('sort_by')) url.searchParams.append('sort_by', draftSort);
        if (!searchParams.has('page')) url.searchParams.append('page', '1');

        const response = await fetch(url);
        if (!response.ok) throw new Error("Search request failed");
        
        const rawJson = await response.json();
        setTickets(rawJson.data.tickets);
        setPagination(rawJson.data.pagination);
      } catch (err) {
        setError("Could not load tickets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams, draftLimit, draftSort]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    const timer = setTimeout(() => {
      const newParams = new URLSearchParams();
      
      if (draftSearch.trim()) newParams.set('q', draftSearch.trim());
      if (draftSport) newParams.set('sport_type', draftSport);
      if (draftCategory !== 'Any') newParams.set('category', draftCategory);
      if (priceRange[0] > 0) newParams.set('min_price', priceRange[0]);
      if (priceRange[1] < 500) newParams.set('max_price', priceRange[1]);
      if (draftStartDate) newParams.set('start_date', draftStartDate);
      if (draftEndDate) newParams.set('end_date', draftEndDate);
      if (draftIncludeSoldOut) newParams.set('include_sold_out', 'true');
      if (draftShowPast) newParams.set('show_past', 'true');
      
      newParams.set('sort_by', draftSort);
      newParams.set('limit', draftLimit);
      newParams.set('page', 1);

      setSearchParams(newParams);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    draftSearch, draftSport, draftCategory, priceRange, 
    draftStartDate, draftEndDate, draftIncludeSoldOut, 
    draftShowPast, draftSort, draftLimit
  ]);

  const goToPage = (pageNumber) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNumber);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setDraftSearch('');
    setDraftSport('');
    setDraftCategory('Any');
    setPriceRange([0, 500]);
    setDraftStartDate('');
    setDraftEndDate('');
    setDraftIncludeSoldOut(false);
    setDraftShowPast(false);
    setDraftSort('date_asc');
    setDraftLimit('12');
  };

  return (
    <>
      <style>{`
        .react-datepicker { font-family: inherit; border-radius: 0.75rem; border-color: #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: #FFFFFF; }
        .react-datepicker__header { background-color: #F9FAFB; border-bottom-color: #E5E7EB; border-top-left-radius: 0.75rem !important; border-top-right-radius: 0.75rem !important; }
        .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker-time__header { color: #111827; }
        .react-datepicker__day { color: #4B5563; }
        .react-datepicker__day:hover { background-color: #F3F4F6; border-radius: 8px; color: #111827; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background-color: #8B5CF6 !important; color: white !important; border-radius: 8px; }
        .react-datepicker__day--disabled { color: #D1D5DB; }
        
        .react-datepicker__time-container { border-left-color: #E5E7EB; }
        .react-datepicker__time { background-color: #FFFFFF !important; border-bottom-right-radius: 0.75rem; }
        .react-datepicker__time-list-item { color: #4B5563; }
        .react-datepicker__time-list-item:hover { background-color: #F3F4F6 !important; color: #111827 !important; }
        .react-datepicker__time-list-item--selected { background-color: #8B5CF6 !important; color: white !important; font-weight: bold; }
        
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
        
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; }
      `}</style>

    <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-8">
      
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-[#FFFFFF] dark:bg-[#232130] rounded-2xl border border-[#E5E7EB] dark:border-[#2D2B3D] p-6 shadow-sm sticky top-6">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#111827] dark:text-[#FFFFFF]">Filters</h2>
            <button 
            onClick={resetFilters}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 dark:bg-[#B794F4]/10 dark:text-[#B794F4] dark:hover:bg-[#B794F4]/20 transition-colors"
            >
            Reset
            </button>
          </div>

          <div className="space-y-8">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Search</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Teams, venues..." 
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-3 text-[#9CA3AF]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Sport</label>
              <div className="flex flex-wrap gap-2">
                {['Football', 'Basketball', 'Volleyball'].map(sport => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => setDraftSport(draftSport === sport ? '' : sport)}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                      draftSport === sport 
                        ? 'bg-[#8B5CF6] text-white border border-[#8B5CF6]' 
                        : 'bg-transparent text-[#6B7280] dark:text-[#A2A2CC] border border-[#E5E7EB] dark:border-[#2D2B3D] hover:border-[#8B5CF6] dark:hover:border-[#B794F4]'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Category</label>
              <div className="relative">
                <select 
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm cursor-pointer shadow-sm"
                >
                  <option value="Any">All Categories</option>
                  <option value="VIP">VIP</option>
                  <option value="Normal">Normal</option>
                  <option value="Economy">Economy</option>
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute right-3 top-3.5 text-[#9CA3AF] pointer-events-none">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">Price Range</label>
                <span className="text-[#111827] dark:text-[#B794F4] font-bold text-sm">
                  ${priceRange[0]} - ${priceRange[1]}
                </span>
              </div>
              
              <div className="pt-2 px-2">
                <ReactSlider
                  className="w-full h-1.5 bg-[#E5E7EB] dark:bg-[#2D2B3D] rounded-full"
                  thumbClassName="w-5 h-5 -mt-1.5 bg-[#8B5CF6] dark:bg-[#B794F4] rounded-full cursor-grab focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/30 shadow-md"
                  trackClassName="track"
                  renderTrack={(props, state) => (
                    <div {...props} className={`h-1.5 rounded-full ${state.index === 1 ? 'bg-[#8B5CF6] dark:bg-[#B794F4]' : 'bg-[#E5E7EB] dark:bg-[#2D2B3D]'}`} />
                  )}
                  value={priceRange}
                  onChange={setPriceRange}
                  min={0}
                  max={500}
                  step={10}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E5E7EB] dark:border-[#2D2B3D]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">From Date</label>
                <DatePicker
                  selected={draftStartDate ? new Date(draftStartDate) : null}
                  onChange={(date) => setDraftStartDate(date ? date.toISOString().split('T')[0] : '')}
                  placeholderText="Select start date"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm shadow-sm placeholder-[#9CA3AF] dark:placeholder-[#6B7280]"
                  dateFormat="MMM d, yyyy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">To Date</label>
                <DatePicker
                  selected={draftEndDate ? new Date(draftEndDate) : null}
                  onChange={(date) => setDraftEndDate(date ? date.toISOString().split('T')[0] : '')}
                  minDate={draftStartDate ? new Date(draftStartDate) : null}
                  placeholderText="Select end date"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#F9FAFB] dark:bg-[#1A1924] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm shadow-sm placeholder-[#9CA3AF] dark:placeholder-[#6B7280]"
                  dateFormat="MMM d, yyyy"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#E5E7EB] dark:border-[#2D2B3D]">
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-semibold text-[#111827] dark:text-[#FFFFFF] group-hover:text-[#8B5CF6] transition-colors">Include Sold Out</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={draftIncludeSoldOut} onChange={(e) => setDraftIncludeSoldOut(e.target.checked)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${draftIncludeSoldOut ? 'bg-[#8B5CF6]' : 'bg-[#E5E7EB] dark:bg-[#2D2B3D]'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${draftIncludeSoldOut ? 'translate-x-4' : ''}`}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-semibold text-[#111827] dark:text-[#FFFFFF] group-hover:text-[#8B5CF6] transition-colors">Include Past Events</span>
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={draftShowPast} onChange={(e) => setDraftShowPast(e.target.checked)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${draftShowPast ? 'bg-[#8B5CF6]' : 'bg-[#E5E7EB] dark:bg-[#2D2B3D]'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${draftShowPast ? 'translate-x-4' : ''}`}></div>
                </div>
              </label>

            </div>

          </div>
        </div>
      </div>

      <div className="flex-grow">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight">Events</h1>
            <p className="text-[#6B7280] dark:text-[#A2A2CC] text-sm mt-1">
              {pagination ? `Showing ${tickets.length} of ${pagination.total_items} tickets` : 'Loading...'}
            </p>
          </div>

          <div className="flex gap-3">
            <select 
            value={draftLimit}
            onChange={(e) => setDraftLimit(e.target.value)}
            className="pl-4 pr-8 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm font-semibold cursor-pointer shadow-sm"
            >
            <option value="12">12 per page</option>
            <option value="24">24 per page</option>
            <option value="36">36 per page</option>
            </select>

            <select 
              value={draftSort}
              onChange={(e) => setDraftSort(e.target.value)}
              className="pl-4 pr-8 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm font-semibold cursor-pointer shadow-sm"
            >
              <option value="date_asc">Soonest First</option>
              <option value="date_desc">Furthest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
           <div className="py-20 text-center text-[#6B7280] dark:text-[#A2A2CC] animate-pulse font-bold text-xl">Searching Database...</div>
        ) : error ? (
           <div className="py-20 text-center text-[#FF6E6E] font-bold bg-[#FF6E6E]/10 rounded-2xl border border-[#FF6E6E]/20">{error}</div>
        ) : tickets.length === 0 ? (
           <div className="py-20 text-center bg-[#FFFFFF] dark:bg-[#232130] rounded-2xl border border-[#E5E7EB] dark:border-[#2D2B3D]">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-[#9CA3AF] mb-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm3.65 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" />
             </svg>
             <p className="text-[#6B7280] dark:text-[#A2A2CC] font-medium">No tickets found matching those filters.</p>
             <button onClick={resetFilters} className="mt-4 text-[#8B5CF6] font-semibold hover:underline">Clear all filters</button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tickets.map(ticket => (
              <TicketCard key={ticket.ticket_id} ticket={ticket} />
            ))}
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button 
              onClick={() => goToPage(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F9FAFB] dark:hover:bg-[#1A1924] font-semibold transition-colors shadow-sm"
            >
              Previous
            </button>
            
            <span className="text-sm font-semibold text-[#6B7280] dark:text-[#A2A2CC]">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>

            <button 
              onClick={() => goToPage(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#232130] border border-[#E5E7EB] dark:border-[#2D2B3D] text-[#111827] dark:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F9FAFB] dark:hover:bg-[#1A1924] font-semibold transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
    </>
  );
}