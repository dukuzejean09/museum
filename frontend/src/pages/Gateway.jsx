import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useVisitor } from '../context/VisitorContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { loginAdmin } from '../api';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode, KeyRound, Loader2, AlertCircle, Landmark, Globe,
  Calendar, ArrowRight, ShieldCheck, Lock, Eye, EyeOff, X,
  Camera, ScanLine, Mountain, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ───────────────────────────────────────────
   Inline SVG: Rwandan hills silhouette
   ─────────────────────────────────────────── */
const HillsSilhouette = () => (
  <svg viewBox="0 0 800 340" className="w-full h-auto" preserveAspectRatio="none">
    {/* Far hills — faint */}
    <path d="M0 340 L0 160 Q100 60 200 130 Q300 50 400 110 Q500 30 600 100 Q700 50 800 120 L800 340Z"
      fill="url(#hillFar)" opacity="0.25" />
    {/* Mid hills */}
    <path d="M0 340 L0 190 Q80 110 180 160 Q280 90 380 150 Q480 80 560 140 Q680 70 800 150 L800 340Z"
      fill="url(#hillMid)" opacity="0.4" />
    {/* Near hills */}
    <path d="M0 340 L0 220 Q120 160 240 210 Q360 150 480 200 Q600 140 720 195 Q780 175 800 200 L800 340Z"
      fill="url(#hillNear)" opacity="0.55" />
    {/* Closest hill */}
    <path d="M0 340 L0 260 Q200 210 400 250 Q600 210 800 260 L800 340Z"
      fill="url(#hillClose)" opacity="0.7" />

    {/* ── Intore warrior silhouette on the hill ── */}
    <g transform="translate(540, 145)" opacity="0.6" fill="#fbbf24">
      {/* Head */}
      <circle cx="12" cy="0" r="5" />
      {/* Headdress feathers (Intore crown) */}
      <path d="M7 -3 L3 -14 M9 -4 L7 -16 M12 -5 L12 -18 M15 -4 L17 -16 M17 -3 L21 -14"
        stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Body */}
      <path d="M12 5 L12 30" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right arm raised holding spear */}
      <path d="M12 12 L26 2" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Spear shaft */}
      <path d="M26 2 L34 -18" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      {/* Spear tip */}
      <path d="M32 -14 L34 -22 L36 -14 Z" />
      {/* Left arm holding ingabo shield */}
      <path d="M12 14 L-2 10" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ingabo (shield) — oval with center line */}
      <ellipse cx="-8" cy="8" rx="8" ry="14" fill="none" stroke="#fbbf24" strokeWidth="2" />
      <ellipse cx="-8" cy="8" rx="5" ry="10" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
      <path d="M-8 -6 L-8 22" stroke="#fbbf24" strokeWidth="1.2" />
      {/* Skirt / umushanana */}
      <path d="M6 28 L12 30 L18 28 L16 48 L8 48 Z" />
      {/* Legs */}
      <path d="M9 48 L6 65 M15 48 L18 65" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* ── Inyambo cows (long-horned Rwandan cattle) ── */}
    {/* Cow 1 — on the nearest hill */}
    <g transform="translate(160, 230)" opacity="0.45" fill="#d97706">
      {/* Body */}
      <ellipse cx="20" cy="12" rx="18" ry="9" />
      {/* Head */}
      <ellipse cx="40" cy="8" rx="5" ry="4" />
      {/* Long curved horns (Inyambo signature) */}
      <path d="M38 5 Q34 -10 28 -14" stroke="#d97706" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M42 5 Q46 -10 52 -14" stroke="#d97706" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <path d="M10 20 L8 34 M16 20 L15 34 M26 20 L27 34 M32 20 L33 34" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
      {/* Tail */}
      <path d="M2 10 Q-6 6 -4 14" stroke="#d97706" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
    {/* Cow 2 — slightly further back */}
    <g transform="translate(240, 222)" opacity="0.35" fill="#b45309">
      <ellipse cx="16" cy="10" rx="14" ry="7" />
      <ellipse cx="32" cy="7" rx="4" ry="3" />
      <path d="M30 4 Q27 -6 22 -9" stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M34 4 Q37 -6 42 -9" stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 16 L7 27 M14 16 L13 27 M22 16 L23 27 M27 16 L28 27" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
    </g>
    {/* Cow 3 — grazing, head down */}
    <g transform="translate(320, 235)" opacity="0.3" fill="#92400e">
      <ellipse cx="16" cy="10" rx="14" ry="7" />
      <ellipse cx="32" cy="14" rx="4" ry="3" />
      <path d="M30 12 Q28 2 24 -1" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M34 12 Q36 2 40 -1" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 16 L7 27 M14 16 L13 27 M22 16 L23 27 M27 16 L28 27" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" />
    </g>

    <defs>
      <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#1c1917" />
      </linearGradient>
      <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#713f12" />
        <stop offset="100%" stopColor="#0c0a09" />
      </linearGradient>
      <linearGradient id="hillClose" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#422006" />
        <stop offset="100%" stopColor="#0a0a0a" />
      </linearGradient>
    </defs>
  </svg>
);

/* Imigongo repeating diamond strip */
const ImigongoStrip = ({ count = 14, className = '' }) => (
  <svg viewBox={`0 0 ${count * 28} 14`} className={`w-full h-3.5 ${className}`} preserveAspectRatio="none">
    {Array.from({ length: count }).map((_, i) => (
      <g key={i} transform={`translate(${i * 28}, 0)`}>
        <polygon points="14,0 28,7 14,14 0,7" fill={i % 2 === 0 ? '#92400e' : '#b45309'} />
        <polygon points="14,3 22,7 14,11 6,7" fill={i % 2 === 0 ? '#d97706' : '#78350f'} />
        <circle cx="14" cy="7" r="1" fill="#fbbf24" opacity="0.7" />
      </g>
    ))}
  </svg>
);

/* Small floating Imigongo tile */
const FloatingTile = ({ delay = 0, x = 0, y = 0 }) => (
  <svg
    width="32" height="32" viewBox="0 0 32 32"
    className="absolute opacity-10 animate-pulse"
    style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s`, animationDuration: '4s' }}
  >
    <polygon points="16,0 32,16 16,32 0,16" fill="#d97706" />
    <polygon points="16,6 26,16 16,26 6,16" fill="#fbbf24" />
    <polygon points="16,10 22,16 16,22 10,16" fill="#f59e0b" />
  </svg>
);


const Gateway = () => {
  const { t, lang, setLang, LANGUAGES } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, activateAccess, clearAccess, loading } = useVisitor();
  const { admin, login } = useAuth();

  // Visitor access state
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [autoValidating, setAutoValidating] = useState(false);

  // QR scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Staff login modal state
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from || '/';

  useEffect(() => {
    if (admin) navigate('/admin/dashboard', { replace: true });
  }, [admin, navigate]);

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !autoValidating) {
      setAutoValidating(true);
      setCode(urlCode);
      handleValidate(urlCode);
    }
  }, [searchParams]);

  const handleValidate = async (codeToValidate) => {
    const c = codeToValidate || code;
    if (!c.trim()) return;
    setValidating(true);
    setError('');
    try {
      clearAccess();
      await activateAccess(c.trim());
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('gateway.invalidCode'));
    } finally {
      setValidating(false);
      setAutoValidating(false);
    }
  };

  const handleCodeSubmit = (e) => { e.preventDefault(); handleValidate(); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data } = await loginAdmin({ email: loginEmail, password: loginPassword });
      login(data);
      toast.success(t('gateway.loginSuccess'));
      navigate('/admin/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || t('gateway.loginFailed'));
    } finally {
      setLoginLoading(false);
    }
  };

  // ── QR Scanner ──
  const startScanner = async () => {
    setScannerError('');
    setShowScanner(true);
    // Wait for modal DOM to render before initializing camera
    await new Promise((r) => setTimeout(r, 500));
    try {
      const readerEl = document.getElementById('qr-reader');
      if (!readerEl) throw new Error('Scanner container not found');
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;
      const containerWidth = readerEl.clientWidth;
      const qrboxSize = Math.min(350, Math.floor(containerWidth * 0.65));
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize }, aspectRatio: 1.0 },
        (decodedText) => {
          let scannedCode = decodedText;
          try {
            const url = new URL(decodedText);
            const codeParam = url.searchParams.get('code');
            if (codeParam) scannedCode = codeParam;
          } catch { /* raw code */ }
          stopScanner();
          setCode(scannedCode);
          handleValidate(scannedCode);
        },
        () => {}
      );
    } catch (err) {
      const msg = err?.message || String(err);
      setScannerError(
        msg.includes('NotAllowedError') || msg.includes('Permission')
          ? 'Camera permission denied. Please allow camera access.'
          : 'Could not start camera. Make sure no other app is using it.'
      );
      setShowScanner(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) await html5QrCodeRef.current.stop();
      html5QrCodeRef.current?.clear();
    } catch { /* ignore */ }
    html5QrCodeRef.current = null;
    setShowScanner(false);
  };

  useEffect(() => {
    return () => { html5QrCodeRef.current?.isScanning && html5QrCodeRef.current.stop().catch(() => {}); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* ── Floating Imigongo tiles (decorative background) ── */}
      <FloatingTile x={5} y={15} delay={0} />
      <FloatingTile x={85} y={10} delay={1.2} />
      <FloatingTile x={75} y={60} delay={2.5} />
      <FloatingTile x={10} y={70} delay={0.8} />
      <FloatingTile x={50} y={5} delay={1.8} />
      <FloatingTile x={92} y={45} delay={3} />
      <FloatingTile x={30} y={85} delay={2} />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3">
        <div className="flex items-center gap-1.5">
          <Globe size={14} className="text-amber-500" />
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition ${
                lang === l.code ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/60 transition text-xs"
        >
          <ShieldCheck size={14} />
          <span className="hidden sm:inline">{t('gateway.staffLogin')}</span>
        </button>
      </div>

      {/* ── Imigongo cultural band ── */}
      <ImigongoStrip className="relative z-10" />

      {/* ── Main two-column layout ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-stretch">

        {/* ════ LEFT COLUMN — Cultural branding with hills ════ */}
        <div className="lg:w-1/2 flex flex-col justify-end relative overflow-hidden">
          {/* Radial glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-transparent" />

          {/* Branding content */}
          <div className="relative z-10 px-6 sm:px-10 lg:px-14 pt-8 lg:pt-0 lg:pb-0 flex flex-col justify-center flex-1">
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-500/15 rounded-3xl flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Landmark size={44} className="text-amber-400 sm:hidden" />
                  <Landmark size={52} className="text-amber-400 hidden sm:block" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                    {t('gateway.welcome')}
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 lg:mb-8">
                {t('gateway.subtitle')}
              </p>

              {/* Cultural highlights */}
              <div className="hidden lg:grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <Mountain size={20} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-white text-xs font-semibold">Land of a Thousand Hills</p>
                    <p className="text-slate-500 text-[11px]">Rwanda's natural heritage</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <Sparkles size={20} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-white text-xs font-semibold">Imigongo Art</p>
                    <p className="text-slate-500 text-[11px]">Traditional geometric patterns</p>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <p className="hidden lg:block text-amber-600/50 text-xs italic">
                "Ubumwe, Umurimo, Gukunda Igihugu"
              </p>
            </div>
          </div>

          {/* Hills silhouette at the bottom of left column */}
          <div className="relative mt-auto">
            <HillsSilhouette />
            {/* Tiny stars above hills */}
            <div className="absolute top-2 left-[15%] w-1 h-1 bg-amber-300/40 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="absolute top-6 left-[40%] w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-3 left-[65%] w-1 h-1 bg-amber-200/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-8 left-[80%] w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* ════ RIGHT COLUMN — Forms ════ */}
        <div className="lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-6 lg:py-10">
          <div className="w-full max-w-md">

            {/* Already authenticated */}
            {!loading && isAuthenticated && !admin ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                    <ShieldCheck size={24} className="text-green-400" />
                  </div>
                  <p className="text-green-300 font-semibold mb-1">{t('gateway.alreadyActive') || 'Access Active'}</p>
                  <p className="text-slate-400 text-sm">{t('gateway.alreadyActiveDesc') || 'You already have a valid access session.'}</p>
                </div>
                <button
                  onClick={() => navigate(redirectTo, { replace: true })}
                  className="w-full bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  {t('gateway.continue') || 'Continue to Museum'}
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => { clearAccess(); setCode(''); setError(''); }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl transition font-medium border border-slate-700 flex items-center justify-center gap-2 text-sm"
                >
                  <KeyRound size={14} />
                  {t('gateway.useNewCode') || 'Enter a Different Code'}
                </button>
              </div>
            ) : (
              <>
                {/* Hook message */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 text-center">
                  <p className="text-amber-300 text-xs sm:text-sm font-medium leading-relaxed">
                    {t('gateway.hookMessage')}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-xl mb-4 flex items-center gap-2 justify-center text-sm">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                {/* Auto-validating spinner */}
                {autoValidating ? (
                  <div className="flex items-center justify-center gap-3 text-amber-400 py-12">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-lg">{t('gateway.validating')}</span>
                  </div>
                ) : (
                  <>
                    {/* ════ TWO-COLUMN: Code Entry + QR Scan ════ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

                      {/* ── Code Entry Card ── */}
                      <div className="bg-white/5 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <KeyRound size={16} className="text-amber-400" />
                          <h2 className="text-white text-sm font-semibold">{t('gateway.accessTitle')}</h2>
                        </div>
                        <p className="text-slate-400 text-xs mb-3 leading-relaxed">
                          {t('gateway.enterCode')}
                        </p>
                        <form onSubmit={handleCodeSubmit} className="space-y-2.5">
                          <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder={t('gateway.codePlaceholder')}
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-center text-sm tracking-widest font-mono"
                            disabled={validating}
                            autoFocus
                            autoComplete="off"
                          />
                          <button
                            type="submit"
                            disabled={validating || !code.trim()}
                            className="w-full bg-amber-600 text-white py-2.5 rounded-lg hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                          >
                            {validating ? (
                              <><Loader2 size={14} className="animate-spin" />{t('gateway.validating')}</>
                            ) : (
                              <>{t('gateway.enter')}<ArrowRight size={14} /></>
                            )}
                          </button>
                        </form>
                      </div>

                      {/* ── QR Scanner Card ── */}
                      <div className="bg-white/5 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Camera size={16} className="text-amber-400" />
                          <h2 className="text-white text-sm font-semibold">
                            {t('gateway.scanTitle') || 'Scan QR Code'}
                          </h2>
                        </div>
                        <p className="text-slate-400 text-xs mb-3 leading-relaxed">
                          {t('gateway.scanDesc') || 'Use your camera to scan the QR code at the entrance.'}
                        </p>
                        {scannerError && (
                          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-2 rounded-lg flex items-start gap-1.5 text-xs mb-3">
                            <AlertCircle size={12} className="mt-0.5 shrink-0" />
                            {scannerError}
                          </div>
                        )}
                        <button
                          onClick={startScanner}
                          className="w-full flex items-center justify-center gap-2 bg-slate-700/60 hover:bg-slate-700 text-white py-2.5 rounded-lg transition font-semibold border border-slate-600/50 text-sm"
                        >
                          <QrCode size={16} />
                          {t('gateway.openScanner') || 'Open Scanner'}
                        </button>
                      </div>
                    </div>

                    {/* ── Book a Visit (full width below) ── */}
                    <div className="bg-white/5 backdrop-blur border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-amber-400 shrink-0" />
                          <h2 className="text-white text-sm font-semibold truncate">{t('gateway.bookTitle')}</h2>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          {t('gateway.bookDesc')}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/book')}
                        className="shrink-0 bg-slate-700/60 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg transition font-medium border border-slate-600/50 flex items-center gap-1.5 text-sm"
                      >
                        {t('gateway.bookTitle')}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Imigongo band + footer ── */}
      <ImigongoStrip className="relative z-10" />
      <div className="relative z-10 text-center py-3 text-slate-600 text-[11px] flex items-center justify-center gap-1.5">
        <Lock size={10} />
        {t('gateway.secureFooter')}
      </div>

      {/* ═══════════════════════════════════
          QR Scanner Modal (full-screen camera overlay)
         ═══════════════════════════════════ */}
      {showScanner && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80">
            <div className="flex items-center gap-2">
              <ScanLine size={20} className="text-amber-400 animate-pulse" />
              <span className="text-white font-bold text-sm">
                {t('gateway.scanning') || 'Scanning QR Code'}
              </span>
            </div>
            <button
              onClick={stopScanner}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* Camera — takes remaining space */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-lg aspect-square rounded-2xl overflow-hidden bg-black relative border-2 border-amber-500/40 shadow-[0_0_60px_rgba(217,119,6,0.2)]">
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full h-full qr-reader-no-title"
              />
              {/* Corner scan markers */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
              </div>
              {/* Animated scan line */}
              <div className="absolute left-4 right-4 h-0.5 bg-amber-400/60 animate-[scanline_2s_ease-in-out_infinite] pointer-events-none" />
            </div>
          </div>

          {/* Bottom instructions */}
          <div className="px-4 pb-6 text-center space-y-3">
            <p className="text-slate-400 text-sm">
              {t('gateway.pointCamera') || 'Point your camera at the QR code displayed at the museum entrance'}
            </p>
            <button
              onClick={stopScanner}
              className="text-slate-500 hover:text-white text-sm transition underline underline-offset-2"
            >
              {t('gateway.cancelScan') || 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          Staff Login Modal
         ═══════════════════════════════════ */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <ShieldCheck size={18} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{t('gateway.staffPortal')}</h2>
                  <p className="text-[11px] text-slate-400">{t('gateway.staffPortalDesc')}</p>
                </div>
              </div>
              <button onClick={() => setShowLogin(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle size={14} />
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">{t('gateway.email')}</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="staff@museum.rw"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">{t('gateway.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-amber-600 text-white py-2.5 rounded-xl hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loginLoading ? (
                  <><Loader2 size={16} className="animate-spin" />{t('gateway.signingIn')}</>
                ) : (
                  <><Lock size={14} />{t('gateway.signIn')}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gateway;
