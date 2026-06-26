import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Headphones, X } from 'lucide-react';

/* ─── Narration script split into caption segments ─── */
const SEGMENTS = [
  "Welcome to Kandt House Museum, one of Rwanda's most important historical museums.",
  "Here you will explore Rwanda's natural heritage, wildlife, geological history, and the fascinating story of Doctor Richard Kandt, the first colonial resident of Kigali.",
  "This digital museum platform has been designed to make your visit more interactive and engaging.",
  "You can explore exhibitions, experience Augmented Reality, watch educational videos, view historical artifacts in 3D, participate in quizzes, and discover detailed information about every exhibition.",
  "Our intelligent multilingual assistant is always available to answer your questions and guide you throughout your visit in your preferred language.",
  "Whether you are visiting physically or exploring remotely, this platform offers an immersive learning experience for students, researchers, tourists, and anyone interested in Rwanda's rich history and culture.",
  "We invite you to begin your journey and enjoy discovering the remarkable heritage preserved at Kandt House Museum.",
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

const findBestVoice = () => {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (!enVoices.length) return voices[0];
  enVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return enVoices[0];
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
   — Always shows a "Listen" button first (user click).
   — User click guarantees browser allows speech.
   ═══════════════════════════════════════════════ */
const GatewayNarrator = () => {
  // States: prompt | speaking | muted | done | dismissed
  const [state, setState] = useState('prompt');
  const [segIdx, setSegIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [voicesReady, setVoicesReady] = useState(false);

  const activeRef = useRef(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const mountedRef = useRef(true);

  /* ── Load voices on mount ── */
  useEffect(() => {
    mountedRef.current = true;

    if (!window.speechSynthesis) return;

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
      }
    };

    checkVoices();
    window.speechSynthesis.onvoiceschanged = () => checkVoices();

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
      if (s?.speaking) {
        s.pause();
        s.resume();
      }
    }, 10000);
    return () => clearInterval(iv);
  }, [state]);

  /* ── Speak all segments sequentially ── */
  const speak = useCallback(() => {
    if (!window.speechSynthesis) {
      alert('Your browser does not support speech synthesis.');
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    activeRef.current = true;
    setSegIdx(-1);
    setProgress(0);
    setState('speaking');
    startTimeRef.current = Date.now();

    // Progress timer
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!activeRef.current) return clearInterval(timerRef.current);
      const pct = Math.min((Date.now() - startTimeRef.current) / 85000, 1);
      setProgress(pct);
    }, 250);

    const voice = findBestVoice();

    let idx = 0;
    const speakNext = () => {
      if (!activeRef.current || !mountedRef.current) return;
      if (idx >= SEGMENTS.length) {
        clearInterval(timerRef.current);
        setProgress(1);
        setTimeout(() => {
          if (mountedRef.current) {
            setState('done');
            activeRef.current = false;
          }
        }, 500);
        return;
      }

      const utt = new SpeechSynthesisUtterance(SEGMENTS[idx]);
      if (voice) utt.voice = voice;
      utt.lang = 'en-US';
      utt.rate = 0.78;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const currentIdx = idx;
      utt.onstart = () => {
        if (mountedRef.current) setSegIdx(currentIdx);
      };
      utt.onend = () => {
        idx++;
        setTimeout(speakNext, 300);
      };
      utt.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        idx++;
        setTimeout(speakNext, 300);
      };

      synth.speak(utt);
    };

    speakNext();
  }, []);

  /* ── Stop ── */
  const stop = useCallback(() => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const toggleMute = () => {
    if (state === 'speaking') {
      stop();
      setState('muted');
    } else if (state === 'muted') {
      speak();
    }
  };

  const dismiss = () => {
    stop();
    setState('dismissed');
  };

  // Hidden states
  if (state === 'dismissed') return null;
  if (!window.speechSynthesis) return null;

  const caption = segIdx >= 0 && segIdx < SEGMENTS.length ? SEGMENTS[segIdx] : '';

  return (
    <>
      <style>{`
        @keyframes gwNarrWave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.8); }
        }
        @keyframes gwCaptionIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gwPromptPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(217,119,6,0); }
        }
        @keyframes gwFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-3 sm:px-4 pb-4 sm:pb-6">

        {/* ── PROMPT: tap to start ── */}
        {state === 'prompt' && (
          <div
            className="pointer-events-auto flex items-center gap-2"
            style={{ animation: 'gwFadeIn 0.6s ease-out' }}
          >
            <button
              onClick={speak}
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
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  Museum Narrator
                </p>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Tap to hear the welcome narration
                </p>
              </div>
            </button>
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white transition"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── SPEAKING / MUTED / DONE panel ── */}
        {(state === 'speaking' || state === 'muted' || state === 'done') && (
          <div
            className="pointer-events-auto w-full max-w-2xl rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40"
            style={{ background: 'rgba(15, 15, 20, 0.88)' }}
          >
            {/* Progress bar */}
            {state === 'speaking' && (
              <div className="h-[3px] bg-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 transition-all duration-500 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            )}

            <div className="px-4 sm:px-5 py-3 sm:py-4">
              {/* Speaking / muted */}
              {(state === 'speaking' || state === 'muted') && (
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Waveform */}
                  <div className="flex items-center gap-[3px] h-8 shrink-0 mt-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <WaveBar key={i} active={state === 'speaking'} i={i} />
                    ))}
                  </div>

                  {/* Caption */}
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-400/70 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-1">
                      Museum Narrator
                    </p>
                    {state === 'speaking' && caption ? (
                      <p
                        key={segIdx}
                        className="text-white/90 text-xs sm:text-sm leading-relaxed"
                        style={{ animation: 'gwCaptionIn 0.35s ease-out' }}
                      >
                        {caption}
                      </p>
                    ) : state === 'muted' ? (
                      <p className="text-slate-500 text-xs sm:text-sm italic">
                        Narration paused — tap to resume
                      </p>
                    ) : (
                      <p className="text-slate-500 text-xs sm:text-sm">Starting...</p>
                    )}
                  </div>

                  {/* Mute / unmute + close */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <button
                      onClick={toggleMute}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 hover:text-white"
                      title={state === 'speaking' ? 'Mute' : 'Resume'}
                    >
                      {state === 'speaking' ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                    <button
                      onClick={dismiss}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 hover:text-white"
                      title="Close"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Done */}
              {state === 'done' && (
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-[3px] h-8 shrink-0">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <WaveBar key={i} active={false} i={i} />
                    ))}
                  </div>
                  <p className="flex-1 text-slate-400 text-xs sm:text-sm">
                    Welcome narration complete
                  </p>
                  <button
                    onClick={speak}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition text-xs sm:text-sm font-medium"
                  >
                    <RotateCcw size={13} />
                    Replay
                  </button>
                  <button
                    onClick={dismiss}
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 hover:text-white"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GatewayNarrator;
