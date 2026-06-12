import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateVisitorCode } from '../api';
import toast from 'react-hot-toast';

const VisitorContext = createContext();

export const useVisitor = () => useContext(VisitorContext);

export const VisitorProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null); // in minutes

  // Check localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('visitorToken');
    const savedExpiry = localStorage.getItem('visitorExpiresAt');

    if (savedToken && savedExpiry) {
      const expiry = new Date(savedExpiry);
      if (expiry > new Date()) {
        setToken(savedToken);
        setExpiresAt(expiry);
      } else {
        // Expired — clean up
        localStorage.removeItem('visitorToken');
        localStorage.removeItem('visitorExpiresAt');
      }
    }
    setLoading(false);
  }, []);

  // Update remaining time every 30 seconds
  useEffect(() => {
    if (!expiresAt) {
      setRemainingTime(null);
      return;
    }

    const update = () => {
      const diff = Math.max(0, expiresAt - new Date());
      const minutes = Math.ceil(diff / 60000);
      setRemainingTime(minutes);

      if (diff <= 0) {
        clearAccess();
        toast.error('Your access has expired. Please scan the QR code again.');
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const activateAccess = useCallback(async (code) => {
    const { data } = await validateVisitorCode(code);
    const expiry = new Date(Date.now() + data.expiresIn * 1000);

    setToken(data.token);
    setExpiresAt(expiry);

    localStorage.setItem('visitorToken', data.token);
    localStorage.setItem('visitorExpiresAt', expiry.toISOString());
  }, []);

  const clearAccess = useCallback(() => {
    setToken(null);
    setExpiresAt(null);
    setRemainingTime(null);
    localStorage.removeItem('visitorToken');
    localStorage.removeItem('visitorExpiresAt');
  }, []);

  const isAuthenticated = !!token && expiresAt && expiresAt > new Date();

  return (
    <VisitorContext.Provider value={{
      token,
      isAuthenticated,
      loading,
      remainingTime,
      activateAccess,
      clearAccess,
    }}>
      {children}
    </VisitorContext.Provider>
  );
};
