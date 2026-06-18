import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useVisitor } from '../context/VisitorContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { loginAdmin } from '../api';
import {
  QrCode, KeyRound, Loader2, AlertCircle, Landmark, Globe,
  Calendar, Users, ArrowRight, ShieldCheck, Lock, Eye, EyeOff, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // Staff login modal state
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from || '/';

  // If staff already authenticated, redirect to dashboard
  useEffect(() => {
    if (admin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [admin, navigate]);

  // Auto-validate code from URL query param (?code=KM-XXXXX)
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
      const msg = err.response?.data?.message || t('gateway.invalidCode');
      setError(msg);
    } finally {
      setValidating(false);
      setAutoValidating(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    handleValidate();
  };

  // Staff login handler
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* ─── Top bar: Language + Staff Login ─── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Language selector — inline flags */}
        <div className="flex items-center gap-1.5">
          <Globe size={16} className="text-amber-500" />
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                lang === l.code
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Staff login button */}
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition text-sm"
        >
          <ShieldCheck size={16} />
          <span className="hidden sm:inline">{t('gateway.staffLogin')}</span>
        </button>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          {/* Museum branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/15 rounded-2xl mb-5 border border-amber-500/20">
              <Landmark size={40} className="text-amber-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              {t('gateway.welcome')}
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto">
              {t('gateway.subtitle')}
            </p>
          </div>

          {/* Already authenticated — show continue or re-enter */}
          {!loading && isAuthenticated && !admin ? (
            <div className="space-y-5">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                  <ShieldCheck size={24} className="text-green-400" />
                </div>
                <p className="text-green-300 font-semibold mb-1">{t('gateway.alreadyActive') || 'Access Active'}</p>
                <p className="text-slate-400 text-sm">{t('gateway.alreadyActiveDesc') || 'You already have a valid access session.'}</p>
              </div>
              <button
                onClick={() => navigate(redirectTo, { replace: true })}
                className="w-full bg-amber-600 text-white py-3.5 rounded-xl hover:bg-amber-700 transition font-semibold flex items-center justify-center gap-2"
              >
                {t('gateway.continue') || 'Continue to Museum'}
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => { clearAccess(); setCode(''); setError(''); }}
                className="w-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition font-medium border border-slate-600/50 flex items-center justify-center gap-2"
              >
                <KeyRound size={16} />
                {t('gateway.useNewCode') || 'Enter a Different Code'}
              </button>
            </div>
          ) : (
            <>
              {/* Hook message */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 text-center">
                <p className="text-amber-300 text-sm font-medium leading-relaxed">
                  {t('gateway.hookMessage')}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Auto-validating from QR scan */}
              {autoValidating ? (
                <div className="flex items-center justify-center gap-3 text-amber-400 mb-6 py-8">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-lg">{t('gateway.validating')}</span>
                </div>
              ) : (
                <>
                  {/* ─── Access Code Entry ─── */}
                  <div className="bg-white/5 backdrop-blur border border-slate-700/50 rounded-2xl p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <QrCode size={18} className="text-amber-400" />
                      <h2 className="text-white font-semibold">{t('gateway.accessTitle')}</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                      {t('gateway.enterCode')}
                    </p>
                    <form onSubmit={handleCodeSubmit} className="space-y-3">
                      <div className="relative">
                        <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/70" />
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder={t('gateway.codePlaceholder')}
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-800 border-2 border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-center text-lg tracking-widest font-mono"
                          disabled={validating}
                          autoFocus
                          autoComplete="off"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={validating || !code.trim()}
                        className="w-full bg-amber-600 text-white py-3.5 rounded-xl hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {validating ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {t('gateway.validating')}
                          </>
                        ) : (
                          <>
                            {t('gateway.enter')}
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* ─── Book a Visit ─── */}
                  <div className="bg-white/5 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={18} className="text-amber-400" />
                      <h2 className="text-white font-semibold">{t('gateway.bookTitle')}</h2>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                      {t('gateway.bookDesc')}
                    </p>
                    <button
                      onClick={() => navigate('/book-external')}
                      className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-white py-3 px-4 rounded-xl transition font-medium border border-slate-600/50"
                    >
                      <Calendar size={16} />
                      {t('gateway.bookTitle')}
                      <ArrowRight size={14} className="ml-auto" />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center py-5 text-slate-600 text-xs flex items-center justify-center gap-1.5">
        <Lock size={12} />
        {t('gateway.secureFooter')}
      </div>

      {/* ═══════════════════════════════════════════════
          Staff Login Modal
      ═══════════════════════════════════════════════ */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{t('gateway.staffPortal')}</h2>
                  <p className="text-xs text-slate-400">{t('gateway.staffPortalDesc')}</p>
                </div>
              </div>
              <button onClick={() => setShowLogin(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition">
                <X size={18} />
              </button>
            </div>

            {/* Login form */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm">
                  <AlertCircle size={15} />
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('gateway.email')}</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="staff@museum.rw"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('gateway.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('gateway.signingIn')}
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    {t('gateway.signIn')}
                  </>
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
