import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminInfo');
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = (adminData) => {
    setAdmin(adminData);
    setToken(adminData.token);
    localStorage.setItem('adminToken', adminData.token);
    localStorage.setItem('adminInfo', JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
  };

  const isAdmin = admin?.role === 'admin';
  const isGuide = admin?.role === 'guide';

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout, isAdmin, isGuide }}>
      {children}
    </AuthContext.Provider>
  );
};
