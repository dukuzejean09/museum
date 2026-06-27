import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Square, RotateCcw, Volume2, VolumeX, Volume1,
  Gauge, ChevronDown, Headphones,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

/* ─── Bilingual narration segments (EN / FR) ─── */
const SEGMENTS = {
  en: [
    "Kandt House Museum is not just a building, it is a living story of Rwanda's identity, from its rich history to the vibrant culture of today.",
    "Ever wondered what Kigali looked like over a hundred years ago? Doctor Richard Kandt was the first European to settle here, and his story is only the beginning of what this museum holds.",
    "To explore this digital museum, you have two options. Book a visit to get your access code, or if you already have a code, enter it to unlock the full experience right away.",
    "Once inside, dive into curated exhibitions and follow guided trails that take you through Rwanda's history and cultural heritage, step by step.",
    "Point your camera at museum artifacts and watch them come alive through our image-based Augmented Reality experience, bringing history closer than ever before.",
    "Discover the untold stories behind each exhibition and explore rich details about every artifact, all presented in your preferred language.",
    "This is not your typical museum visit. Whether you are a student, a curious traveler, or someone discovering Rwanda for the first time, this experience was built for you. Start exploring now.",
  ],
  fr: [
    "Le Musée de la Maison Kandt n'est pas qu'un simple bâtiment, c'est une histoire vivante de l'identité du Rwanda, depuis son riche passé jusqu'à la culture vibrante d'aujourd'hui.",
    "Vous êtes-vous déjà demandé à quoi ressemblait Kigali il y a plus de cent ans ? Le Docteur Richard Kandt fut le premier Européen à s'y installer, et son histoire n'est que le début de ce que ce musée renferme.",
    "Pour explorer ce musée numérique, vous avez deux options. Réservez une visite pour obtenir votre code d'accès, ou si vous avez déjà un code, saisissez-le pour débloquer l'expérience complète immédiatement.",
    "Une fois à l'intérieur, plongez dans des expositions organisées et suivez des parcours guidés qui vous emmènent à travers l'histoire et le patrimoine culturel du Rwanda, étape par étape.",
    "Pointez votre caméra sur les artefacts du musée et regardez-les prendre vie grâce à notre expérience de Réalité Augmentée basée sur l'image, rapprochant l'histoire comme jamais auparavant.",
    "Découvrez les histoires méconnues derrière chaque exposition et explorez les détails riches de chaque artefact, le tout présenté dans votre langue préférée.",
    "Ce n'est pas une visite de musée ordinaire. Que vous soyez étudiant, voyageur curieux, ou que vous découvriez le Rwanda pour la première fois, cette expérience a été conçue pour vous. Commencez à explorer maintenant.",
  ],
};

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×' },
  { value: 0.75, label: '0.75×' },
  { value: 1, label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2×' },
];

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

/* ─── Animated waveform bar ─── */
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

/* ═══════════════════════════════════════════════════
   GatewayNarrator — inline player for Gateway left column.

   Renders TWO things based on state:
   • isActive = false → a prompt button (small, non-intrusive)
   • isActive = true  → full decorated player that replaces
     the left column branding content

   The parent (Gateway.jsx) conditionally renders this
   in place of the branding section.
   ═══════════════════════════════════════════════════ */
const GatewayNarrator = () => {
  const { lang: systemLang } = useLanguage();
  const narrLang = SEGMENTS[systemLang] ? systemLang : null;

  const [state, setState] = useState('prompt'); // prompt | speaking | paused | done | dismissed
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

  const estimatedDuration = segments.reduce((sum, seg) => {
    const words = seg.split(/\s+/).length;
    return sum + (words / (narrLang === 'fr' ? 2.2 : 2.5)) / speed;
  }, 0);

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

  useEffect(() => {
    if (state !== 'speaking') return;
    const iv = setInterval(() => {
      const s = window.speechSynthesis;
      if (s?.speaking) { s.pause(); s.resume(); }
    }, 10000);
    return () => clearInterval(iv);
  }, [state]);

  useEffect(() => {
    const handler = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) setShowSpeedMenu(false);
      if (volumeRef.current && !volumeRef.current.contains(e.target)) setShowVolumeSlider(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

    const voice = findBestVoice(narrLang === 'fr' ? 'fr' : 'en');
    let idx = 0;
    const speakNext = () => {
      if (!activeRef.current || !mountedRef.current) return;
      if (idx >= segments.length) {
        clearInterval(timerRef.current);
        const finalTime = (Date.now() - startTimeRef.current) / 1000;
        setProgress(100);
        setCurrentTime(finalTime);
        setDuration(finalTime);
        setTimeout(() => { if (mountedRef.current) { setState('done'); activeRef.current = false; } }, 400);
        return;
      }
      const utt = new SpeechSynthesisUtterance(segments[idx]);
      if (voice) utt.voice = voice;
      utt.lang = narrLang === 'fr' ? 'fr-FR' : 'en-US';
      utt.rate = (narrLang === 'fr' ? 0.82 : 0.78) * speed;
      utt.pitch = 1.0;
      utt.volume = muted ? 0 : volume;
      const ci = idx;
      utt.onstart = () => { if (mountedRef.current) setSegIdx(ci); };
      utt.onend = () => { idx++; setTimeout(speakNext, 300); };
      utt.onerror = (e) => { if (e.error === 'canceled' || e.error === 'interrupted') return; idx++; setTimeout(speakNext, 300); };
      synth.speak(utt);
    };
    speakNext();
  }, [narrLang, segments, speed, volume, muted, estimatedDuration]);

  const stopFull = useCallback(() => {
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
    } else {
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

  const changeSpeed = (s) => { setSpeed(s); setShowSpeedMenu(false); };
  const changeVolume = (v) => { setVolume(v); if (v > 0 && muted) setMuted(false); };

  if (state === 'dismissed') return null;
  if (!window.speechSynthesis) return null;

  const caption = segIdx >= 0 && segIdx < segments.length ? segments[segIdx] : '';
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const isActive = state === 'speaking' || state === 'paused' || state === 'done';

  /* ── Prompt state: small inline button ── */
  if (!isActive) {
    return (
      <>
        <style>{`
          @keyframes gwPromptPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.35); }
            50% { box-shadow: 0 0 0 10px rgba(217,119,6,0); }
          }
          @keyframes gwFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{ animation: 'gwFadeIn 0.5s ease-out' }}>
          {narrLang ? (
            <button
              onClick={play}
              className="group flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/25 hover:border-amber-500/50 hover:from-amber-500/15 hover:to-amber-600/10 transition-all duration-300"
              style={{ animation: 'gwPromptPulse 2.5s ease-in-out infinite' }}
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition">
                <Headphones size={20} className="text-amber-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">
                  {narrLang === 'fr' ? 'Découvrir le musée' : 'Discover the museum'}
                </p>
                <p className="text-slate-400 text-xs">
                  {narrLang === 'fr' ? 'Appuyez pour en savoir plus' : 'Tap to learn more'}
                </p>
              </div>
              <Play size={18} className="text-amber-400/60 group-hover:text-amber-400 transition shrink-0" />
            </button>
          ) : (
            <div className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-slate-500/5 border border-slate-500/20">
              <div className="w-11 h-11 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
                <Headphones size={20} className="text-slate-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-slate-400 text-sm">Narration ntiboneka muri Ikinyarwanda</p>
                <p className="text-slate-400 text-xs">Narration is not available in Kinyarwanda</p>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  /* ── Active player: decorated, replaces left column content ── */
  return (
    <>
      <style>{`
        @keyframes gwNarrWave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.8); }
        }
        @keyframes gwCaptionIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gwPlayerIn {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gwGlowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <div
        className="w-full flex flex-col"
        style={{ animation: 'gwPlayerIn 0.5s ease-out' }}
      >
        {/* ── Player card ── */}
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-slate-900/80 via-amber-950/20 to-slate-900/80 backdrop-blur-md shadow-xl shadow-amber-900/10">

          {/* Decorative glow */}
          <div
            className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
            style={{ animation: state === 'speaking' ? 'gwGlowPulse 3s ease-in-out infinite' : 'none' }}
          />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* ── Header ── */}
            <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
              <div className="flex items-center gap-[3px] h-6 shrink-0">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <WaveBar key={i} active={state === 'speaking'} i={i} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-400/80 text-[11px] font-semibold uppercase tracking-widest">
                  {narrLang === 'fr' ? 'À l\'écoute' : 'Now playing'}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/15">
                {narrLang === 'fr' ? 'FR' : 'EN'}
              </span>
            </div>

            {/* ── Caption area ── */}
            <div className="px-5 py-4 min-h-[80px] flex items-center">
              {state === 'speaking' && caption ? (
                <p
                  key={segIdx}
                  className="text-white/90 text-sm sm:text-base leading-relaxed"
                  style={{ animation: 'gwCaptionIn 0.35s ease-out' }}
                >
                  {caption}
                </p>
              ) : state === 'paused' ? (
                <p className="text-slate-400 text-sm italic">
                  {narrLang === 'fr' ? 'Narration en pause — appuyez sur lecture pour reprendre' : 'Paused — press play to resume'}
                </p>
              ) : state === 'done' ? (
                <p className="text-slate-400 text-sm">
                  {narrLang === 'fr' ? 'Prêt à explorer ? Réservez ou entrez votre code ci-contre.' : 'Ready to explore? Book a visit or enter your code.'}
                </p>
              ) : (
                <p className="text-slate-400 text-sm">{narrLang === 'fr' ? 'Démarrage...' : 'Starting...'}</p>
              )}
            </div>

            {/* ── Progress bar ── */}
            <div className="px-5">
              <div className="h-1.5 rounded-full bg-white/5 relative group cursor-default">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-300 shadow-lg shadow-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400 tabular-nums">{formatTime(currentTime)}</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{formatTime(state === 'done' ? duration : estimatedDuration)}</span>
              </div>
            </div>

            {/* ── Controls ── */}
            <div className="px-5 pt-2 pb-4 flex items-center gap-2">
              {/* Stop */}
              <button
                onClick={stopFull}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
                title="Stop"
              >
                <Square size={12} />
              </button>

              {/* Play / Pause — center, bigger */}
              <button
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-lg shadow-amber-600/20 mx-1"
                aria-label={state === 'speaking' ? 'Pause' : 'Play'}
              >
                {state === 'speaking'
                  ? <Pause size={18} />
                  : <Play size={18} className="ml-0.5" />}
              </button>

              {/* Restart */}
              <button
                onClick={restart}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
                title="Restart"
              >
                <RotateCcw size={12} />
              </button>

              <div className="flex-1" />

              {/* Volume */}
              <div className="relative" ref={volumeRef}>
                <button
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
                >
                  <VolumeIcon size={14} />
                </button>
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 p-3 z-20 w-40">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setMuted(!muted)} className="text-slate-400 hover:text-amber-400 transition">
                        <VolumeIcon size={12} />
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
                  className="flex items-center gap-1 px-2.5 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition text-xs"
                >
                  <Gauge size={12} />
                  <span className="tabular-nums">{speed}×</span>
                  <ChevronDown size={10} />
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 py-1 z-20 min-w-[80px]">
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
            </div>
          </div>
        </div>

        {/* ── Segment dots indicator ── */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {segments.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === segIdx
                  ? 'w-5 h-1.5 bg-amber-400'
                  : i < segIdx
                    ? 'w-1.5 h-1.5 bg-amber-400/40'
                    : 'w-1.5 h-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default GatewayNarrator;
