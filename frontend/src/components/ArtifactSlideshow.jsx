import { useState, useEffect, useCallback } from 'react';

const getBaseUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
};

/**
 * Fading slideshow of artifact images.
 * Props:
 *   artifacts - array of artifact objects (with .image and .name fields)
 *   className - optional container class
 *   interval  - ms between slides (default 4000)
 *   overlay   - optional overlay gradient class
 *   children  - content rendered on top of the slideshow
 */
const ArtifactSlideshow = ({ artifacts = [], className = '', interval = 4000, overlay, children }) => {
  const images = artifacts
    .map(a => ({ url: a?.image || a?.coverImage, name: a?.name?.en || a?.title?.en || '' }))
    .filter(i => i.url);

  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const advance = useCallback(() => {
    if (images.length <= 1) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(prev => (prev + 1) % images.length);
      setFading(false);
    }, 700); // match CSS transition duration
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(advance, interval);
    return () => clearInterval(timer);
  }, [advance, interval, images.length]);

  if (images.length === 0) {
    return (
      <div className={`bg-slate-800 ${className}`}>
        {overlay && <div className={overlay} />}
        {children}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Current image */}
      <img
        src={imgUrl(images[current].url)}
        alt={images[current].name}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${fading ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Next image (preloaded underneath, visible during fade) */}
      {images.length > 1 && (
        <img
          src={imgUrl(images[(current + 1) % images.length].url)}
          alt={images[(current + 1) % images.length].name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay */}
      {overlay && <div className={`absolute inset-0 ${overlay}`} />}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 700); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Children on top */}
      {children}
    </div>
  );
};

/**
 * Compact version for cards (exhibition/trail listing cards).
 * Same fade logic, no dots, no children support needed.
 */
export const ArtifactSlideshowCard = ({ artifacts = [], className = '', interval = 3000 }) => {
  const images = artifacts
    .map(a => a?.image || a?.coverImage)
    .filter(Boolean);

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) {
    return <div className={`bg-slate-100 ${className}`} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {images.map((img, i) => (
        <img
          key={i}
          src={imgUrl(img)}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
};

export default ArtifactSlideshow;
