/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { getUserProfile, saveUserProfile } from '../services/userDataService';

export const AuthContext = createContext({
  isAuthenticated: true,
  user: null,
  login: () => {},
  logout: () => {},
  updateProfile: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedAuth = localStorage.getItem('budget_buddy_is_authenticated');
    if (savedAuth === 'false') return null;
    return getUserProfile();
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('budget_buddy_is_authenticated');
    if (savedAuth === 'false') return false;
    return true;
  });

  useEffect(() => {
    const handleDataChange = () => {
      const savedAuth = localStorage.getItem('budget_buddy_is_authenticated');
      if (savedAuth === 'false') {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        const current = getUserProfile();
        setUser(current);
        setIsAuthenticated(true);
      }
    };
    window.addEventListener('userDataChanged', handleDataChange);
    return () => window.removeEventListener('userDataChanged', handleDataChange);
  }, []);

  const login = (newUser) => {
    const current = getUserProfile();
    const updated = { ...current, ...newUser };
    saveUserProfile(updated);
    localStorage.setItem('budget_buddy_is_authenticated', 'true');
    setUser(updated);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.setItem('budget_buddy_is_authenticated', 'false');
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event('userDataChanged'));
  };

  const updateProfile = (fields) => {
    const updated = { ...user, ...fields };
    saveUserProfile(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
