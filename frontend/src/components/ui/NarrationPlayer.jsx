import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';

/**
 * NarrationPlayer – plays pre-recorded audio when available,
 * falls back to the browser Web Speech API (SpeechSynthesis) for TTS.
 *
 * Props:
 *  - audioSrc   : URL to pre-recorded mp3/audio (optional)
 *  - text       : text to narrate via browser TTS when no audioSrc
 *  - title      : label shown above the player (optional)
 *  - lang       : BCP-47 language hint for TTS (default 'en')
 */

const LANG_MAP = { en: 'en-US', fr: 'fr-FR', rw: 'rw-RW' };

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const NarrationPlayer = ({ audioSrc, text, title, lang = 'en' }) => {
  /* ── shared state ── */
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState(audioSrc ? 'audio' : 'tts'); // 'audio' | 'tts'
  const [muted, setMuted] = useState(false);

  /* ── audio-element refs ── */
  const audioRef = useRef(null);

  /* ── TTS refs ── */
  const utterRef = useRef(null);
  const ttsTimerRef = useRef(null);
  const ttsStartRef = useRef(0);
  const ttsPausedAtRef = useRef(0);

  // Switch mode if audioSrc changes
  useEffect(() => {
    setMode(audioSrc ? 'audio' : 'tts');
  }, [audioSrc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis?.cancel();
      clearInterval(ttsTimerRef.current);
    };
  }, []);

  /* ═══════════════════════════════
     Audio element handlers
  ═══════════════════════════════ */
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
  }, []);

  const handleSeek = (e) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
  };

  /* ═══════════════════════════════
     TTS helpers
  ═══════════════════════════════ */
  const estimateTTSDuration = (t) => {
    // rough: ~150 words/min
    const words = (t || '').split(/\s+/).length;
    return Math.max(5, (words / 150) * 60);
  };

  const startTTSTimer = () => {
    const est = estimateTTSDuration(text);
    setDuration(est);
    ttsStartRef.current = Date.now() - ttsPausedAtRef.current * 1000;
    ttsTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - ttsStartRef.current) / 1000;
      setCurrentTime(Math.min(elapsed, est));
      setProgress(Math.min((elapsed / est) * 100, 100));
    }, 250);
  };

  const stopTTSTimer = () => {
    clearInterval(ttsTimerRef.current);
  };

  /* ═══════════════════════════════
     Play / Pause / Stop
  ═══════════════════════════════ */
  const play = () => {
    if (mode === 'audio') {
      audioRef.current?.play();
      setPlaying(true);
    } else {
      // TTS
      const synth = window.speechSynthesis;
      if (!synth) return;

      if (synth.paused) {
        synth.resume();
        startTTSTimer();
        setPlaying(true);
        return;
      }

      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LANG_MAP[lang] || lang;
      utter.rate = 0.95;
      utter.pitch = 1;

      // Try to pick a good voice
      const voices = synth.getVoices();
      const langPrefix = (LANG_MAP[lang] || lang).split('-')[0];
      const preferred = voices.find(v => v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes('female'))
        || voices.find(v => v.lang.startsWith(langPrefix))
        || voices[0];
      if (preferred) utter.voice = preferred;

      utter.onend = () => {
        setPlaying(false);
        setProgress(100);
        stopTTSTimer();
        ttsPausedAtRef.current = 0;
      };

      utterRef.current = utter;
      ttsPausedAtRef.current = 0;
      synth.speak(utter);
      startTTSTimer();
      setPlaying(true);
    }
  };

  const pause = () => {
    if (mode === 'audio') {
      audioRef.current?.pause();
    } else {
      window.speechSynthesis?.pause();
      ttsPausedAtRef.current = (Date.now() - ttsStartRef.current) / 1000;
      stopTTSTimer();
    }
    setPlaying(false);
  };

  const stop = () => {
    if (mode === 'audio') {
      const a = audioRef.current;
      if (a) { a.pause(); a.currentTime = 0; }
    } else {
      window.speechSynthesis?.cancel();
      stopTTSTimer();
      ttsPausedAtRef.current = 0;
    }
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const toggleMute = () => {
    if (mode === 'audio' && audioRef.current) {
      audioRef.current.muted = !muted;
    }
    setMuted(!muted);
  };

  // Nothing to narrate
  if (!audioSrc && !text) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
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
        <Volume2 size={18} className="text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title || 'Audio Narration'}
        </span>
        {mode === 'tts' && (
          <span className="ml-auto text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-medium">
            Text-to-Speech
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={playing ? pause : play}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          aria-label={playing ? 'Pause' : 'Play narration'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        {playing && (
          <button
            onClick={stop}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Stop"
          >
            <Square size={14} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            className="h-2 rounded-full bg-amber-200 dark:bg-amber-800/40 cursor-pointer"
            onClick={mode === 'audio' ? handleSeek : undefined}
          >
            <div
              className="h-full rounded-full bg-amber-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {mode === 'audio' && (
          <button
            onClick={toggleMute}
            className="flex-shrink-0 text-slate-500 dark:text-slate-400 hover:text-amber-600 transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default NarrationPlayer;
