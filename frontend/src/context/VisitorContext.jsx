import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateVisitorCode } from '../api';
import toast from 'react-hot-toast';

const VisitorContext = createContext();

export const useVisitor = () => useContext(VisitorContext);

export const VisitorProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [sessionStart, setSessionStart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(null); // in seconds

  // Check localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('visitorToken');
    const savedExpiry = localStorage.getItem('visitorExpiresAt');
    const savedStart = localStorage.getItem('visitorSessionStart');

    if (savedToken && savedExpiry) {
      const expiry = new Date(savedExpiry);
      if (expiry > new Date()) {
        setToken(savedToken);
        setExpiresAt(expiry);
        setSessionStart(savedStart ? new Date(savedStart) : null);
      } else {
        // Expired — clean up
        localStorage.removeItem('visitorToken');
        localStorage.removeItem('visitorExpiresAt');
        localStorage.removeItem('visitorSessionStart');
      }
    }
    setLoading(false);
  }, []);

  // Update remaining time every second for accurate countdown
  useEffect(() => {
    if (!expiresAt) {
      setRemainingTime(null);
      return;
    }

    const update = () => {
      const diff = Math.max(0, expiresAt - new Date());
      const seconds = Math.ceil(diff / 1000);
      setRemainingTime(seconds);

      if (diff <= 0) {
        clearAccess();
        toast.error('Your access has expired. Please scan the QR code again.');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const activateAccess = useCallback(async (code) => {
    const { data } = await validateVisitorCode(code);
    const now = new Date();
    const expiry = new Date(now.getTime() + data.expiresIn * 1000);

    setToken(data.token);
    setExpiresAt(expiry);
    setSessionStart(now);

    localStorage.setItem('visitorToken', data.token);
    localStorage.setItem('visitorExpiresAt', expiry.toISOString());
    localStorage.setItem('visitorSessionStart', now.toISOString());
  }, []);

  const clearAccess = useCallback(() => {
    setToken(null);
    setExpiresAt(null);
    setSessionStart(null);
    setRemainingTime(null);
    localStorage.removeItem('visitorToken');
    localStorage.removeItem('visitorExpiresAt');
    localStorage.removeItem('visitorSessionStart');
  }, []);

  const isAuthenticated = !!token && expiresAt && expiresAt > new Date();

  return (
    <VisitorContext.Provider value={{
      token,
      isAuthenticated,
      loading,
      remainingTime,
      sessionStart,
      expiresAt,
      activateAccess,
      clearAccess,
    }}>
      {children}
    </VisitorContext.Provider>
  );
};
