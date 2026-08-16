import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tket_token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('tket_token');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        localStorage.removeItem('tket_token');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('tket_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('tket_token');
    setIsAuthenticated(false);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};