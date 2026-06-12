import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AudioPlayer = ({ src, title, duration }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setTotalDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * totalDuration;
  };

  const progress = totalDuration ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mb-1">
            {title}
          </p>
        )}
        <div
          className="h-1.5 rounded-full bg-amber-200 dark:bg-amber-800/40 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-amber-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          {duration && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
