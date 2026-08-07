import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#FFFFFF] dark:bg-[#232130] border-t border-[#E5E7EB] dark:border-[#2D2B3D] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="md:col-span-1">
            <Link to="/" className="text-[#111827] dark:text-[#FFFFFF] text-3xl font-extrabold tracking-tighter inline-block mb-4 hover:opacity-80 transition-opacity">
              tket.
            </Link>
            <p className="text-[#6B7280] dark:text-[#A2A2CC] text-sm leading-relaxed mb-6 font-medium">
              The premium destination for securing your spot at the biggest sports events. Fast, secure, and built for the fans.
            </p>
          </div>

          <div>
            <h3 className="text-[#111827] dark:text-[#FFFFFF] text-sm font-bold uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Home</Link></li>
              <li><Link to="/search" className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Browse Events</Link></li>
              <li><Link to="/search?q=football" className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Football Tickets</Link></li>
              <li><Link to="/search?q=basketball" className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Basketball Tickets</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#111827] dark:text-[#FFFFFF] text-sm font-bold uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-3">
              <li><Link to="/dashboard" state={{ targetTab: 'Tickets' }} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">My Tickets</Link></li>
              <li><Link to="/dashboard" state={{ targetTab: 'Profile' }} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Profile Settings</Link></li>
              <li><Link to="/dashboard" state={{ targetTab: 'Reports' }} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Support Reports</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#111827] dark:text-[#FFFFFF] text-sm font-bold uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li><button onClick={() => window.scrollTo(0,0)} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Help Center</button></li>
              <li><button onClick={() => window.scrollTo(0,0)} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Cancellation Policy</button></li>
              <li><button onClick={() => window.scrollTo(0,0)} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Privacy Policy</button></li>
              <li><button onClick={() => window.scrollTo(0,0)} className="text-[#6B7280] dark:text-[#A2A2CC] hover:text-[#8B5CF6] dark:hover:text-[#B794F4] transition-colors text-sm font-medium">Terms of Service</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E5E7EB] dark:border-[#2D2B3D] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#6B7280] dark:text-[#A2A2CC] text-sm font-medium">
            © {currentYear} tket. All rights reserved.
          </p>
          
          <div className="flex items-center gap-5 text-[#6B7280] dark:text-[#A2A2CC]">
            <a href="https://github.com/hossless/tket" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            </a>
            <a href="https://instagram.com/Hosseinless" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-[#E1306C] transition-colors">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
            </a>
            <a href="https://t.me/Hosseinless" target="_blank" rel="noreferrer" aria-label="Telegram" className="hover:text-[#229ED9] transition-colors">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.11.03-1.84 1.18-5.18 3.44-.49.34-.93.5-1.33.49-.44-.01-1.28-.25-1.9-.45-.76-.25-1.36-.38-1.31-.8.02-.21.32-.42.89-.63 3.47-1.52 5.8-2.52 6.96-3 3.31-1.38 4-1.62 4.45-1.63.1 0 .32.02.46.14.11.1.15.24.16.36 0 .04.01.21.01.32z"/></svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}