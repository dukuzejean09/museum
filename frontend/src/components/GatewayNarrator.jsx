import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Square, RotateCcw, Volume2, VolumeX, Volume1,
  Gauge, ChevronDown, X, Headphones,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

/* ─── Bilingual narration segments (EN / FR, equal count & length) ─── */
const SEGMENTS = {
  en: [
    "Welcome to Kandt House Museum, one of Rwanda's most important historical museums.",
    "Here you will explore Rwanda's natural heritage, wildlife, geological history, and the fascinating story of Doctor Richard Kandt, the first colonial resident of Kigali.",
    "This digital museum platform has been designed to make your visit more interactive and engaging.",
    "You can explore exhibitions, experience Augmented Reality, watch educational videos, view historical artifacts in 3D, participate in quizzes, and discover detailed information about every exhibition.",
    "Our intelligent multilingual assistant is always available to answer your questions and guide you throughout your visit in your preferred language.",
    "Whether you are visiting physically or exploring remotely, this platform offers an immersive learning experience for students, researchers, tourists, and anyone interested in Rwanda's rich history and culture.",
    "We invite you to begin your journey and enjoy discovering the remarkable heritage preserved at Kandt House Museum.",
  ],
  fr: [
    "Bienvenue au Musée de la Maison Kandt, l'un des musées historiques les plus importants du Rwanda.",
    "Ici, vous découvrirez le patrimoine naturel du Rwanda, sa faune, son histoire géologique et l'histoire fascinante du Docteur Richard Kandt, premier résident colonial de Kigali.",
    "Cette plateforme muséale numérique a été conçue pour rendre votre visite plus interactive et captivante.",
    "Vous pouvez explorer les expositions, vivre la Réalité Augmentée, regarder des vidéos éducatives, visualiser des artefacts historiques en 3D, participer à des quiz et découvrir des informations détaillées sur chaque exposition.",
    "Notre assistant multilingue intelligent est toujours disponible pour répondre à vos questions et vous accompagner tout au long de votre visite dans la langue de votre choix.",
    "Que vous visitiez en personne ou à distance, cette plateforme offre une expérience d'apprentissage immersive pour les étudiants, chercheurs, touristes et toute personne intéressée par la riche histoire et culture du Rwanda.",
    "Nous vous invitons à commencer votre voyage et à profiter de la découverte du patrimoine remarquable préservé au Musée de la Maison Kandt.",
  ],
};

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
];

/* ─── Voice quality scoring ─── */
const scoreVoice = (v) => {
  const n = v.name.toLowerCase();
  let s = 0;
  if (n.includes('natural')) s += 50;
  if (n.includes('neural')) s += 45;
  if (n.includes('wavenet')) s += 40;
  if (n.includes('enhanced')) s += 30;
  if (n.includes('premium')) s += 25;
  if (n.includes('google')) s += 20;
  if (n.includes('microsoft')) s += 15;
  if (n.includes('apple')) s += 10;
  if (n.includes('compact')) s -= 10;
  if (!v.localService) s += 5;
  return s;
};

const findBestVoice = (langPrefix) => {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const langVoices = voices.filter((v) => v.lang.startsWith(langPrefix));
  if (!langVoices.length) return voices[0];
  langVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return langVoices[0];
};

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/* ─── Waveform bar ─── */
const WaveBar = ({ active, i }) => (
  <div
    className={`w-[3px] rounded-full transition-all duration-300 ${
      active ? 'bg-amber-400' : 'bg-amber-400/30'
    }`}
    style={{
      height: active ? `${14 + Math.sin(i * 1.3) * 8}px` : '4px',
      animation: active
        ? `gwNarrWave 0.7s ease-in-out ${i * 0.08}s infinite alternate`
        : 'none',
    }}
  />
);

/* ═══════════════════════════════════════════════
   GatewayNarrator
   — Uses system language from LanguageContext.
   — Full media controls (play/pause, stop, restart,
     progress bar, speed, volume).
   — No narration for Kinyarwanda (not supported by TTS).
   ═══════════════════════════════════════════════ */
const GatewayNarrator = () => {
  const { lang: systemLang, t } = useLanguage();

  // Narration language: follow system, fallback to 'en' if unsupported
  const narrLang = SEGMENTS[systemLang] ? systemLang : null;

  // States: prompt | speaking | paused | done | dismissed
  const [state, setState] = useState('prompt');
  const [segIdx, setSegIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const activeRef = useRef(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const mountedRef = useRef(true);
  const speedMenuRef = useRef(null);
  const volumeRef = useRef(null);

  const segments = narrLang ? SEGMENTS[narrLang] : [];

  // Estimate total duration based on text length and speed
  const estimatedDuration = segments.reduce((sum, seg) => {
    const words = seg.split(/\s+/).length;
    return sum + (words / (narrLang === 'fr' ? 2.2 : 2.5)) / speed;
  }, 0);

  /* ── Load voices on mount ── */
  useEffect(() => {
    mountedRef.current = true;
    if (!window.speechSynthesis) return;

    const checkVoices = () => window.speechSynthesis.getVoices();
    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;

    return () => {
      mountedRef.current = false;
      activeRef.current = false;
      clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ── Chrome bug: keep synthesis alive ── */
  useEffect(() => {
    if (state !== 'speaking') return;
    const iv = setInterval(() => {
      const s = window.speechSynthesis;
      if (s?.speaking) { s.pause(); s.resume(); }
    }, 10000);
    return () => clearInterval(iv);
  }, [state]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) setShowSpeedMenu(false);
      if (volumeRef.current && !volumeRef.current.contains(e.target)) setShowVolumeSlider(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Speak all segments sequentially ── */
  const play = useCallback(() => {
    if (!narrLang || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    synth.cancel();
    activeRef.current = true;
    setSegIdx(-1);
    setProgress(0);
    setCurrentTime(0);
    setState('speaking');
    startTimeRef.current = Date.now();
    setDuration(estimatedDuration);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!activeRef.current) return clearInterval(timerRef.current);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const pct = Math.min((elapsed / estimatedDuration) * 100, 99);
      setCurrentTime(elapsed);
      setProgress(pct);
    }, 250);

    const langCode = narrLang === 'fr' ? 'fr' : 'en';
    const voice = findBestVoice(langCode);

    let idx = 0;
    const speakNext = () => {
      if (!activeRef.current || !mountedRef.current) return;
      if (idx >= segments.length) {
        clearInterval(timerRef.current);
        const finalTime = (Date.now() - startTimeRef.current) / 1000;
        setProgress(100);
        setCurrentTime(finalTime);
        setDuration(finalTime);
        setTimeout(() => {
          if (mountedRef.current) {
            setState('done');
            activeRef.current = false;
          }
        }, 400);
        return;
      }

      const utt = new SpeechSynthesisUtterance(segments[idx]);
      if (voice) utt.voice = voice;
      utt.lang = narrLang === 'fr' ? 'fr-FR' : 'en-US';
      utt.rate = (narrLang === 'fr' ? 0.82 : 0.78) * speed;
      utt.pitch = 1.0;
      utt.volume = muted ? 0 : volume;

      const currentIdx = idx;
      utt.onstart = () => { if (mountedRef.current) setSegIdx(currentIdx); };
      utt.onend = () => { idx++; setTimeout(speakNext, 300); };
      utt.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        idx++;
        setTimeout(speakNext, 300);
      };

      synth.speak(utt);
    };

    speakNext();
  }, [narrLang, segments, speed, volume, muted, estimatedDuration]);

  const stop = useCallback(() => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
    setProgress(0);
    setCurrentTime(0);
    setSegIdx(-1);
    setState('prompt');
  }, []);

  const togglePlayPause = () => {
    if (state === 'speaking') {
      activeRef.current = false;
      clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
      setState('paused');
    } else if (state === 'paused' || state === 'done') {
      play();
    } else if (state === 'prompt') {
      play();
    }
  };

  const restart = () => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
    setTimeout(() => play(), 100);
  };

  const dismiss = () => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
    setState('dismissed');
  };

  const toggleMute = () => setMuted((m) => !m);

  const changeSpeed = (s) => {
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const changeVolume = (v) => {
    setVolume(v);
    if (v > 0 && muted) setMuted(false);
  };

  // Hidden
  if (state === 'dismissed') return null;
  if (!window.speechSynthesis) return null;

  const caption = segIdx >= 0 && segIdx < segments.length ? segments[segIdx] : '';
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const isActive = state === 'speaking' || state === 'paused' || state === 'done';

  return (
    <>
      <style>{`
        @keyframes gwNarrWave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.8); }
        }
        @keyframes gwCaptionIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gwPromptPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(217,119,6,0); }
        }
        @keyframes gwFadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-3 sm:px-4 pt-4 sm:pt-6">

        {/* ── PROMPT: tap to start ── */}
        {state === 'prompt' && (
          <div
            className="pointer-events-auto flex items-center gap-2"
            style={{ animation: 'gwFadeIn 0.6s ease-out' }}
          >
            {narrLang ? (
              <button
                onClick={play}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl border border-amber-500/30 text-white hover:border-amber-500/50 transition-all duration-300"
                style={{
                  background: 'rgba(15, 15, 20, 0.88)',
                  animation: 'gwPromptPulse 2s ease-in-out infinite',
                }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Headphones size={18} className="text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-slate-300 text-xs sm:text-sm">
                    {narrLang === 'fr'
                      ? 'Appuyez pour écouter la narration de bienvenue'
                      : 'Tap to hear the welcome narration'}
                  </p>
                </div>
              </button>
            ) : (
              /* Kinyarwanda — no narration available */
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-xl border border-slate-500/30 text-white"
                style={{ background: 'rgba(15, 15, 20, 0.88)' }}
              >
                <div className="w-10 h-10 rounded-full bg-slate-600/20 border border-slate-500/40 flex items-center justify-center shrink-0">
                  <Headphones size={18} className="text-slate-400" />
                </div>
                <div className="text-left">
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Narration ntiboneka muri Ikinyarwanda
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Narration is not available in Kinyarwanda
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white transition pointer-events-auto"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── ACTIVE PLAYER (speaking / paused / done) ── */}
        {isActive && (
          <div
            className="pointer-events-auto w-full max-w-2xl rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40"
            style={{ background: 'rgba(15, 15, 20, 0.92)', animation: state === 'speaking' && segIdx === -1 ? 'gwFadeIn 0.4s ease-out' : undefined }}
          >
            {/* ── Caption area ── */}
            <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2">
              <div className="flex items-start gap-3">
                {/* Waveform */}
                <div className="flex items-center gap-[3px] h-6 shrink-0 mt-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <WaveBar key={i} active={state === 'speaking'} i={i} />
                  ))}
                </div>

                {/* Caption text */}
                <div className="flex-1 min-w-0">
                  {state === 'speaking' && caption ? (
                    <p
                      key={segIdx}
                      className="text-white/90 text-xs sm:text-sm leading-relaxed"
                      style={{ animation: 'gwCaptionIn 0.35s ease-out' }}
                    >
                      {caption}
                    </p>
                  ) : state === 'paused' ? (
                    <p className="text-slate-500 text-xs sm:text-sm italic">
                      {narrLang === 'fr' ? 'Narration en pause' : 'Narration paused'}
                    </p>
                  ) : state === 'done' ? (
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {narrLang === 'fr' ? 'Narration terminée' : 'Narration complete'}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-xs sm:text-sm">
                      {narrLang === 'fr' ? 'Démarrage...' : 'Starting...'}
                    </p>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={dismiss}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-400 hover:text-white shrink-0"
                  title="Close"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Progress bar (seekable visual) ── */}
            <div className="px-4 sm:px-5">
              <div className="h-1.5 rounded-full bg-white/10 relative group cursor-pointer">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                </div>
              </div>
              <div className="flex justify-between mt-1 mb-1">
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <span className="text-[10px] text-slate-500 tabular-nums">
                  {formatTime(state === 'done' ? duration : estimatedDuration)}
                </span>
              </div>
            </div>

            {/* ── Media controls ── */}
            <div className="px-4 sm:px-5 pb-3 sm:pb-4 flex items-center gap-2">
              {/* Play / Pause */}
              <button
                onClick={togglePlayPause}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
                aria-label={state === 'speaking' ? 'Pause' : 'Play'}
              >
                {state === 'speaking'
                  ? <Pause size={16} />
                  : <Play size={16} className="ml-0.5" />}
              </button>

              {/* Stop */}
              {(state !== 'prompt') && (
                <button
                  onClick={stop}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition shrink-0"
                  aria-label="Stop"
                  title="Stop"
                >
                  <Square size={13} />
                </button>
              )}

              {/* Restart */}
              <button
                onClick={restart}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition shrink-0"
                aria-label="Restart"
                title="Restart"
              >
                <RotateCcw size={13} />
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Volume */}
              <div className="relative" ref={volumeRef}>
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  <VolumeIcon size={14} />
                </button>
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 rounded-lg shadow-lg border border-white/10 p-3 z-20 w-36">
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="text-slate-400 hover:text-amber-400">
                        <VolumeIcon size={13} />
                      </button>
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={muted ? 0 : volume}
                        onChange={(e) => changeVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 w-7 text-right tabular-nums">
                        {Math.round((muted ? 0 : volume) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Speed */}
              <div className="relative" ref={speedMenuRef}>
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center gap-1 px-2 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition text-xs"
                  aria-label="Speed"
                >
                  <Gauge size={13} />
                  <span className="tabular-nums">{speed}x</span>
                  <ChevronDown size={11} />
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-900 rounded-lg shadow-lg border border-white/10 py-1 z-20 min-w-[80px]">
                    {SPEED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => changeSpeed(opt.value)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          speed === opt.value
                            ? 'text-amber-400 font-semibold bg-amber-500/10'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language badge */}
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {narrLang === 'fr' ? 'FR' : 'EN'}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GatewayNarrator;
