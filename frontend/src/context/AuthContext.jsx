import { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('tket_token');
  });

  const login = (token) => {
    localStorage.setItem('tket_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('tket_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};