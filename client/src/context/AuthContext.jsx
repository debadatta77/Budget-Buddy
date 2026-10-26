/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, userAPI, TOKEN_STORAGE_KEY } from '../services/apiClient';
import { getUserProfile, saveUserProfile, cleanUserName, syncAllFromBackend, clearAllUserData } from '../services/userDataService';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('budget_buddy_is_authenticated');
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return Boolean(token || savedAuth === 'true');
  });

  const [user, setUser] = useState(() => {
    const savedAuth = localStorage.getItem('budget_buddy_is_authenticated');
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const isAuthed = Boolean(token || savedAuth === 'true');
    if (!isAuthed) return null;
    return getUserProfile();
  });

  // Verify live JWT with backend on initial load
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        try {
          const res = await userAPI.getProfile();
          if (res?.success && res?.data) {
            const liveUser = {
              ...res.data,
              name: cleanUserName(res.data.name, res.data.email)
            };
            setUser(liveUser);
            setIsAuthenticated(true);
            saveUserProfile(liveUser);
            localStorage.setItem('budget_buddy_is_authenticated', 'true');
            syncAllFromBackend();
          }
        } catch {
          // Token expired or server unreachable: keep local fallback if authenticated
        }
      }
    };

    verifySession();
  }, []);

  // Listen to cross-tab/local changes
  useEffect(() => {
    const handleDataChange = () => {
      const savedAuth = localStorage.getItem('budget_buddy_is_authenticated');
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const isAuthed = Boolean(token || savedAuth === 'true');
      if (!isAuthed) {
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

  /**
   * User Sign In (Connects to Express / MongoDB backend)
   */
  const login = async ({ email, password }) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res?.success) {
        if (res.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        }
        localStorage.setItem('budget_buddy_is_authenticated', 'true');
        const loggedUser = {
          ...res.user,
          name: cleanUserName(res.user.name, res.user.email)
        };
        setUser(loggedUser);
        setIsAuthenticated(true);
        saveUserProfile(loggedUser);
        syncAllFromBackend();
        return { success: true, user: loggedUser, message: res.message };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err) {
      console.warn('API login error, returning formatted message:', err);
      return {
        success: false,
        reason: err.reason || 'login_failed',
        message: err.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  /**
   * User Registration (Creates real MongoDB User document)
   */
  const register = async ({ name, email, password }) => {
    try {
      const res = await authAPI.register({ name, email, password });
      if (res?.success) {
        if (res.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        }
        localStorage.setItem('budget_buddy_is_authenticated', 'true');
        clearAllUserData();
        const newUser = {
          ...res.user,
          name: cleanUserName(res.user.name, res.user.email)
        };
        setUser(newUser);
        setIsAuthenticated(true);
        saveUserProfile(newUser);
        syncAllFromBackend();
        return { success: true, user: newUser, message: res.message };
      }
      return { success: false, message: res?.message || 'Registration failed' };
    } catch (err) {
      console.warn('API registration error:', err);
      return {
        success: false,
        reason: err.reason || 'already_exists',
        message: err.message || 'An error occurred during registration. Please try again.'
      };
    }
  };

  /**
   * Logout (Clears tokens & resets state)
   */
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignored
    } finally {
      clearAllUserData();
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.setItem('budget_buddy_is_authenticated', 'false');
      setIsAuthenticated(false);
      setUser(null);
      window.dispatchEvent(new Event('userDataChanged'));
    }
  };

  /**
   * Update Profile
   */
  const updateProfile = async (fields) => {
    try {
      const res = await userAPI.updateProfile(fields);
      if (res?.success && res.data) {
        const updated = {
          ...user,
          ...res.data,
          name: cleanUserName(res.data.name, res.data.email)
        };
        saveUserProfile(updated);
        setUser(updated);
        window.dispatchEvent(new Event('userDataChanged'));
        return { success: true, user: updated, message: res.message };
      }
    } catch (err) {
      console.warn('Failed to update profile on backend:', err);
    }
    // Optimistic fallback
    const localUpdated = {
      ...user,
      ...fields,
      name: cleanUserName(fields.name || user?.name, fields.email || user?.email)
    };
    saveUserProfile(localUpdated);
    setUser(localUpdated);
    window.dispatchEvent(new Event('userDataChanged'));
    return { success: true, user: localUpdated };
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
