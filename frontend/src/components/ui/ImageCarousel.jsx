import { useState, useEffect, useCallback } from 'react';

const ImageCarousel = ({ images = [], interval = 5000, className = '' }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const validImages = images.filter(Boolean);
  const count = validImages.length;

  const next = useCallback(() => {
    if (count > 1) {
      setCurrent((prev) => (prev + 1) % count);
    }
  }, [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [paused, count, interval, next]);

  if (count === 0) {
    return (
      <div className={`bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 ${className}`}>
        No image
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {validImages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {validImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current
                  ? 'bg-amber-500'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
