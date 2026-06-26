import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

/* ─── Narration script split into caption segments ─── */
const NARRATION_SEGMENTS = [
  "Welcome to Kandt House Museum, one of Rwanda's most important historical museums.",
  "Here you will explore Rwanda's natural heritage, wildlife, geological history, and the fascinating story of Dr. Richard Kandt, the first colonial resident of Kigali.",
  "This digital museum platform has been designed to make your visit more interactive and engaging.",
  "You can explore exhibitions, experience Augmented Reality, watch educational videos, view historical artifacts in 3D, participate in quizzes, and discover detailed information about every exhibition.",
  "Our intelligent multilingual assistant is always available to answer your questions and guide you throughout your visit in your preferred language.",
  "Whether you are visiting physically or exploring remotely, this platform offers an immersive learning experience for students, researchers, tourists, and anyone interested in Rwanda's rich history and culture.",
  "We invite you to begin your journey and enjoy discovering the remarkable heritage preserved at Kandt House Museum.",
];

/* ─── Voice quality scoring (reuses logic from narrationService) ─── */
const scoreVoice = (voice) => {
  const n = voice.name.toLowerCase();
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
  if (!voice.localService) s += 5;
  return s;
};

const findBestVoice = () => {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;

  const candidates = ['en-US', 'en-GB', 'en-AU', 'en'];
  for (const bcp of candidates) {
    const prefix = bcp.split('-')[0];
    const matches = voices.filter(
      (v) => v.lang === bcp || v.lang.startsWith(prefix + '-')
    );
    if (matches.length) {
      matches.sort((a, b) => scoreVoice(b) - scoreVoice(a));
      return matches[0];
    }
  }
  return voices[0];
};

/* ─── Waveform bar component ─── */
const WaveBar = ({ active, i }) => (
  <div
    className={`w-[3px] rounded-full transition-all duration-200 ${
      active ? 'bg-amber-400' : 'bg-amber-400/30'
    }`}
    style={{
      height: active ? `${12 + Math.sin(i * 1.2) * 8}px` : '4px',
      animation: active ? `waveBar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
    }}
  />
);

/* ═══════════════════════════════════════════════
   GatewayNarrator — auto-playing welcome narrator
   ═══════════════════════════════════════════════ */
const GatewayNarrator = () => {
  const [state, setState] = useState('loading'); // loading | speaking | done | error | muted
  const [segmentIndex, setSegmentIndex] = useState(-1);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const synthRef = useRef(null);
  const utterancesRef = useRef([]);
  const activeRef = useRef(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalDurationRef = useRef(80); // estimated ~80s

  /* ── Build and start narration ── */
  const startNarration = useCallback((isReplay = false) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      setState('error');
      return;
    }
    synthRef.current = synth;

    // Cancel any existing speech
    synth.cancel();
    activeRef.current = true;

    const voice = findBestVoice();
    const utterances = NARRATION_SEGMENTS.map((text, idx) => {
      const utt = new SpeechSynthesisUtterance(text);
      if (voice) utt.voice = voice;
      utt.lang = 'en-US';
      utt.rate = 0.78;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      utt.onstart = () => {
        if (!activeRef.current) return;
        setSegmentIndex(idx);
        setCaptionVisible(true);
      };

      utt.onend = () => {
        if (!activeRef.current) return;
        // Brief pause between segments for natural delivery
        if (idx < NARRATION_SEGMENTS.length - 1) {
          setCaptionVisible(false);
        } else {
          // Last segment done
          setTimeout(() => {
            if (activeRef.current) {
              setState('done');
              setCaptionVisible(false);
              activeRef.current = false;
            }
          }, 600);
        }
      };

      utt.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        if (activeRef.current) setState('error');
      };

      return utt;
    });

    utterancesRef.current = utterances;
    setSegmentIndex(-1);
    setProgress(0);
    setState('speaking');
    startTimeRef.current = Date.now();

    // Start progress timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!activeRef.current) {
        clearInterval(timerRef.current);
        return;
      }
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setProgress(Math.min(elapsed / totalDurationRef.current, 1));
    }, 200);

    // Queue all utterances
    utterances.forEach((u) => synth.speak(u));
  }, []);

  /* ── Stop narration ── */
  const stopNarration = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (synthRef.current) synthRef.current.cancel();
    setCaptionVisible(false);
  }, []);

  /* ── Mute/unmute ── */
  const toggleMute = useCallback(() => {
    if (state === 'speaking') {
      stopNarration();
      setState('muted');
    } else if (state === 'muted') {
      startNarration();
    }
  }, [state, stopNarration, startNarration]);

  /* ── Auto-start after page load ── */
  useEffect(() => {
    let voiceTimer;
    let startTimer;

    const tryStart = () => {
      const synth = window.speechSynthesis;
      if (!synth) {
        setState('error');
        return;
      }

      const voices = synth.getVoices();
      if (voices.length > 0) {
        // Small delay for page to settle
        startTimer = setTimeout(() => startNarration(), 1500);
      } else {
        // Wait for voices to load
        synth.onvoiceschanged = () => {
          startTimer = setTimeout(() => startNarration(), 1500);
        };
        // Fallback if onvoiceschanged never fires
        voiceTimer = setTimeout(() => startNarration(), 3000);
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      tryStart();
    } else {
      window.addEventListener('load', tryStart, { once: true });
    }

    return () => {
      stopNarration();
      clearTimeout(voiceTimer);
      clearTimeout(startTimer);
      window.removeEventListener('load', tryStart);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Chrome bug workaround: keep synthesis alive ── */
  useEffect(() => {
    if (state !== 'speaking') return;
    // Chrome pauses synthesis after ~15s; this keeps it going
    const keepAlive = setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth && synth.speaking) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
    return () => clearInterval(keepAlive);
  }, [state]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Don't render during initial loading
  if (state === 'loading') return null;
  if (state === 'error') return null;

  const currentCaption = segmentIndex >= 0 ? NARRATION_SEGMENTS[segmentIndex] : '';

  return (
    <>
      {/* Keyframes for wave animation */}
      <style>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.6); }
        }
        @keyframes captionFade {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Narrator overlay — bottom of screen ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-4 pb-5 sm:pb-6">
        <div
          className="pointer-events-auto w-full max-w-2xl rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40"
          style={{ background: 'rgba(15, 15, 20, 0.85)' }}
        >
          {/* ── Progress bar ── */}
          {state === 'speaking' && (
            <div className="h-0.5 bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          <div className="px-4 sm:px-5 py-3 sm:py-4">
            {/* ── SPEAKING STATE ── */}
            {(state === 'speaking' || state === 'muted') && (
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Waveform visualizer */}
                <div className="flex items-center gap-[3px] h-8 shrink-0 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <WaveBar key={i} active={state === 'speaking'} i={i} />
                  ))}
                </div>

                {/* Caption area */}
                <div className="flex-1 min-w-0">
                  <p className="text-amber-400/70 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-1">
                    Museum Narrator
                  </p>
                  {state === 'speaking' && captionVisible && currentCaption ? (
                    <p
                      key={segmentIndex}
                      className="text-white/90 text-xs sm:text-sm leading-relaxed"
                      style={{ animation: 'captionFade 0.4s ease-out' }}
                    >
                      {currentCaption}
                    </p>
                  ) : state === 'muted' ? (
                    <p className="text-slate-500 text-xs sm:text-sm italic">
                      Narration paused
                    </p>
                  ) : (
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Preparing...
                    </p>
                  )}
                </div>

                {/* Mute/unmute button */}
                <button
                  onClick={toggleMute}
                  className="shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 hover:text-white"
                  title={state === 'speaking' ? 'Mute' : 'Resume'}
                >
                  {state === 'speaking' ? (
                    <Volume2 size={14} />
                  ) : (
                    <VolumeX size={14} />
                  )}
                </button>
              </div>
            )}

            {/* ── DONE STATE ── */}
            {state === 'done' && (
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Static bars */}
                <div className="flex items-center gap-[3px] h-8 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <WaveBar key={i} active={false} i={i} />
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Welcome narration complete
                  </p>
                </div>

                <button
                  onClick={() => startNarration(true)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition text-xs sm:text-sm font-medium"
                >
                  <RotateCcw size={13} />
                  Replay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GatewayNarrator;
