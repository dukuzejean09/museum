import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Volume1,
  RotateCcw, Settings, ChevronDown, Gauge
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  createNarrationController,
  getVoicesForLanguage,
  waitForVoices,
  estimateDuration,
  LANG_CONFIG,
} from '../../services/narrationService';

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

const LANG_LABELS = { en: 'English', fr: 'Fran\u00E7ais', rw: 'Kinyarwanda' };

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/**
 * NarrationPlayer — comprehensive audio narration player
 *
 * Props:
 *  - audioSrc     : URL to pre-recorded audio (optional)
 *  - text         : text to narrate via browser TTS when no audioSrc
 *  - title        : label shown above the player (optional)
 *  - lang         : language key ('en', 'fr', 'rw') — defaults to current language
 *  - compact      : show compact version (optional)
 *  - autoPlay     : start playing automatically (optional)
 *  - onPlayStateChange : callback(playing: boolean) (optional)
 */
const NarrationPlayer = ({
  audioSrc,
  text,
  title,
  lang: langProp,
  compact = false,
  autoPlay = false,
  onPlayStateChange,
}) => {
  const { t, lang: contextLang } = useLanguage();
  const lang = langProp || contextLang;

  // Mode: pre-recorded audio vs TTS
  const mode = audioSrc ? 'audio' : 'tts';

  // Shared state
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Refs
  const audioRef = useRef(null);
  const controllerRef = useRef(null);
  const speedMenuRef = useRef(null);
  const volumeRef = useRef(null);
  const voiceRef = useRef(null);

  // Initialize TTS controller
  useEffect(() => {
    if (mode === 'tts') {
      const ctrl = createNarrationController();

      ctrl.onStateChange = (state) => {
        const isPlaying = state === 'playing';
        setPlaying(isPlaying);
        onPlayStateChange?.(isPlaying);
      };

      ctrl.onProgress = ({ elapsed, duration: dur, progress: prog }) => {
        setCurrentTime(elapsed);
        setDuration(dur);
        setProgress(prog);
      };

      ctrl.onEnd = () => {
        setPlaying(false);
        setProgress(100);
        setCurrentTime(0);
        onPlayStateChange?.(false);
      };

      controllerRef.current = ctrl;

      return () => {
        ctrl.destroy();
        controllerRef.current = null;
      };
    }
  }, [mode, onPlayStateChange]);

  // Load voices
  useEffect(() => {
    if (mode !== 'tts') return;
    waitForVoices().then(() => {
      const voices = getVoicesForLanguage(lang);
      setAvailableVoices(voices);
      setVoicesLoaded(true);
    });
  }, [mode, lang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      controllerRef.current?.destroy();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) setShowSpeedMenu(false);
      if (volumeRef.current && !volumeRef.current.contains(e.target)) setShowVolumeSlider(false);
      if (voiceRef.current && !voiceRef.current.contains(e.target)) setShowVoiceSelector(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-play
  useEffect(() => {
    if (autoPlay && (audioSrc || text)) {
      const timer = setTimeout(() => play(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  // ═══════════════════════════════════════════════════════════
  // Audio element handlers
  // ═══════════════════════════════════════════════════════════
  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    setDuration(a.duration || 0);
    setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
  }, []);

  const onAudioEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    onPlayStateChange?.(false);
  }, [onPlayStateChange]);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (mode === 'audio' && audioRef.current?.duration) {
      audioRef.current.currentTime = ratio * audioRef.current.duration;
    }
    // TTS seeking not supported — just update visual
  };

  // ═══════════════════════════════════════════════════════════
  // Playback controls
  // ═══════════════════════════════════════════════════════════
  const play = () => {
    if (mode === 'audio') {
      const a = audioRef.current;
      if (a) {
        a.playbackRate = speedMultiplier;
        a.volume = muted ? 0 : volume;
        a.play().catch(() => {});
        setPlaying(true);
        onPlayStateChange?.(true);
      }
    } else {
      const ctrl = controllerRef.current;
      if (!ctrl) return;

      if (ctrl.state === 'paused') {
        ctrl.resume();
      } else {
        const config = LANG_CONFIG[lang] || LANG_CONFIG.en;
        const voice = availableVoices[selectedVoiceIdx] || undefined;
        ctrl.speak(text, lang, {
          rate: config.rate * speedMultiplier,
          pitch: config.pitch,
          volume: muted ? 0 : volume,
          voice,
        });
      }
    }
  };

  const pause = () => {
    if (mode === 'audio') {
      audioRef.current?.pause();
      setPlaying(false);
      onPlayStateChange?.(false);
    } else {
      controllerRef.current?.pause();
    }
  };

  const stop = () => {
    if (mode === 'audio') {
      const a = audioRef.current;
      if (a) { a.pause(); a.currentTime = 0; }
    } else {
      controllerRef.current?.stop();
    }
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    onPlayStateChange?.(false);
  };

  const restart = () => {
    stop();
    setTimeout(() => play(), 100);
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (mode === 'audio' && audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  const changeSpeed = (speed) => {
    setSpeedMultiplier(speed);
    setShowSpeedMenu(false);
    if (mode === 'audio' && audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    // For TTS, speed change takes effect on next play
  };

  const changeVolume = (newVol) => {
    setVolume(newVol);
    if (mode === 'audio' && audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Nothing to narrate
  if (!audioSrc && !text) return null;

  // ═══════════════════════════════════════════════════════════
  // Compact variant
  // ═══════════════════════════════════════════════════════════
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {mode === 'audio' && (
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="metadata"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onTimeUpdate}
            onEnded={onAudioEnded}
          />
        )}
        <button
          onClick={playing ? pause : play}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          aria-label={playing ? t('narration.pause') || 'Pause' : t('narration.play') || 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="h-1.5 rounded-full bg-amber-200 cursor-pointer"
            onClick={mode === 'audio' ? handleSeek : undefined}
          >
            <div
              className="h-full rounded-full bg-amber-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {formatTime(currentTime)}
        </span>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Full variant
  // ═══════════════════════════════════════════════════════════
  return (
    <div
      className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4"
      role="region"
      aria-label={title || t('narration.audioNarration') || 'Audio Narration'}
    >
      {/* Hidden audio element */}
      {mode === 'audio' && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onTimeUpdate}
          onEnded={onAudioEnded}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={18} className="text-amber-600" />
        <span className="text-sm font-semibold text-slate-300">
          {title || t('narration.audioNarration') || 'Audio Narration'}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">
            {LANG_LABELS[lang] || lang}
          </span>
          {mode === 'tts' && (
            <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              TTS
            </span>
          )}
        </div>
      </div>

      {/* Main controls row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={playing ? pause : play}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label={playing ? t('narration.pause') || 'Pause' : t('narration.play') || 'Play narration'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        {/* Stop button */}
        {(playing || progress > 0) && (
          <button
            onClick={stop}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-300 text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label={t('narration.stop') || 'Stop'}
          >
            <Square size={14} />
          </button>
        )}

        {/* Restart button */}
        {progress > 0 && (
          <button
            onClick={restart}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-300 text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label={t('narration.restart') || 'Restart'}
          >
            <RotateCcw size={14} />
          </button>
        )}

        {/* Progress bar */}
        <div className="flex-1 min-w-0">
          <div
            className="h-2 rounded-full bg-amber-200 cursor-pointer relative group"
            onClick={handleSeek}
            role="slider"
            aria-label={t('narration.progress') || 'Narration progress'}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onKeyDown={(e) => {
              if (mode !== 'audio' || !audioRef.current?.duration) return;
              const step = audioRef.current.duration * 0.05;
              if (e.key === 'ArrowRight') audioRef.current.currentTime = Math.min(audioRef.current.currentTime + step, audioRef.current.duration);
              if (e.key === 'ArrowLeft') audioRef.current.currentTime = Math.max(audioRef.current.currentTime - step, 0);
            }}
          >
            <div
              className="h-full rounded-full bg-amber-600 transition-all relative"
              style={{ width: `${progress}%` }}
            >
              {/* Scrubber handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-700 opacity-0 group-hover:opacity-100 transition-opacity shadow" />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {formatTime(duration || estimateDuration(text, lang))}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary controls row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-800/50/30">
        {/* Volume control */}
        <div className="relative" ref={volumeRef}>
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className="flex items-center gap-1 text-slate-400 hover:text-amber-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={muted ? t('narration.unmute') || 'Unmute' : t('narration.mute') || 'Mute'}
          >
            <VolumeIcon size={16} />
          </button>
          {showVolumeSlider && (
            <div className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-3 z-20 w-36">
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-400 hover:text-amber-600">
                  <VolumeIcon size={14} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    changeVolume(v);
                    if (v > 0 && muted) setMuted(false);
                  }}
                  className="flex-1 h-1.5 accent-amber-600 cursor-pointer"
                  aria-label={t('narration.volume') || 'Volume'}
                />
                <span className="text-[10px] text-slate-400 w-7 text-right tabular-nums">
                  {Math.round((muted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Speed control */}
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-600 transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label={t('narration.speed') || 'Playback speed'}
          >
            <Gauge size={14} />
            <span className="tabular-nums">{speedMultiplier}x</span>
            <ChevronDown size={12} />
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-20 min-w-[80px]">
              {SPEED_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => changeSpeed(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-amber-900/20 transition-colors ${
                    speedMultiplier === opt.value
                      ? 'text-amber-600 font-semibold bg-amber-900/20'
                      : 'text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice selector (TTS only) */}
        {mode === 'tts' && availableVoices.length > 1 && (
          <div className="relative ml-auto" ref={voiceRef}>
            <button
              onClick={() => setShowVoiceSelector(!showVoiceSelector)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-600 transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={t('narration.selectVoice') || 'Select voice'}
            >
              <Settings size={14} />
              <span className="hidden sm:inline truncate max-w-[100px]">
                {availableVoices[selectedVoiceIdx]?.name.split(' ').slice(0, 2).join(' ') || 'Voice'}
              </span>
              <ChevronDown size={12} />
            </button>
            {showVoiceSelector && (
              <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-20 max-h-48 overflow-y-auto min-w-[180px]">
                {availableVoices.map((voice, idx) => (
                  <button
                    key={voice.name + voice.lang}
                    onClick={() => {
                      setSelectedVoiceIdx(idx);
                      setShowVoiceSelector(false);
                      // If currently playing, restart with new voice
                      if (playing) {
                        controllerRef.current?.stop();
                        setTimeout(() => play(), 100);
                      }
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-amber-900/20 transition-colors ${
                      selectedVoiceIdx === idx
                        ? 'text-amber-600 font-semibold bg-amber-900/20'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="truncate">{voice.name}</div>
                    <div className="text-[10px] text-slate-400">{voice.lang}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NarrationPlayer;
