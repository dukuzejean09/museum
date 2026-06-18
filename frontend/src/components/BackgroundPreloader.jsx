import { useBackgroundPreloader } from '../hooks/useRealtimeStore';
import { useVisitor } from '../context/VisitorContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';

/**
 * Invisible component that preloads commonly used data in the background.
 * Only preloads when user is authenticated (visitor or admin).
 * Mounted once in App.jsx. Renders nothing.
 */
const BackgroundPreloader = () => {
  const { isAuthenticated } = useVisitor();
  const { admin } = useAuth();
  useBackgroundPreloader(isAuthenticated || !!admin ? api : null);
  return null;
};

export default BackgroundPreloader;
