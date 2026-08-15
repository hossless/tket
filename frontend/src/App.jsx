import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import TicketDetail from './pages/TicketDetail';
import Checkout from './pages/Checkout';
import AdminPanel from './pages/AdminPanel';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('tket_theme');
    
    if (savedTheme === 'dark' || !savedTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tket_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#1A1924] font-sans transition-colors duration-300 flex flex-col">
          
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />           
              <Route path="/search" element={<Search />} />
              <Route path="/ticket/:id" element={<TicketDetail />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkout/:id" 
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
          
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;