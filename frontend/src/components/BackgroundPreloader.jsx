import { useBackgroundPreloader } from '../hooks/useRealtimeStore';
import * as api from '../api';

/**
 * Invisible component that preloads commonly used data in the background.
 * Mounted once in App.jsx. Renders nothing.
 */
const BackgroundPreloader = () => {
  useBackgroundPreloader(api);
  return null;
};

export default BackgroundPreloader;
