import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useVisitor } from '../context/VisitorContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import { QrCode, KeyRound, Loader2, AlertCircle } from 'lucide-react';

const Gateway = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, activateAccess, loading } = useVisitor();
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [autoValidating, setAutoValidating] = useState(false);

  // Where to redirect after successful validation
  const redirectTo = location.state?.from || '/';

  // If already authenticated, redirect
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

  // Auto-validate code from URL query param (?code=KM-XXXXX)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !isAuthenticated && !autoValidating) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    handleValidate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Top bar with language selector */}
      <div className="flex justify-end p-4">
        <LanguageSelector />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* Museum icon/logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/20 rounded-full mb-6">
            <QrCode size={40} className="text-amber-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {t('gateway.welcome')}
          </h1>
          <p className="text-slate-400 mb-8 text-lg">
            {t('gateway.subtitle')}
          </p>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 justify-center">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Auto-validating from QR scan */}
          {autoValidating && (
            <div className="flex items-center justify-center gap-3 text-amber-400 mb-6">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-lg">{t('gateway.validating')}</span>
            </div>
          )}

          {/* Manual code entry */}
          {!autoValidating && (
            <>
              <p className="text-slate-500 text-sm mb-4">
                {t('gateway.enterCode')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={t('gateway.codePlaceholder')}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-center text-lg tracking-widest font-mono"
                    disabled={validating}
                  />
                </div>
                <button
                  type="submit"
                  disabled={validating || !code.trim()}
                  className="w-full bg-amber-600 text-white py-3 rounded-xl hover:bg-amber-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {validating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {t('gateway.validating')}
                    </>
                  ) : (
                    t('gateway.enter')
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-slate-600 text-sm">
        Kandt House Museum &bull; Kigali, Rwanda
      </div>
    </div>
  );
};

export default Gateway;
