import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-7xl font-extrabold text-amber-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        {t('error.notFound') || 'Page Not Found'}
      </h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        {t('error.notFoundDesc') || "The page you're looking for doesn't exist or has been moved."}
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-medium"
        >
          <ArrowLeft size={18} /> {t('common.back') || 'Go Back'}
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition font-medium"
        >
          <Home size={18} /> {t('nav.home') || 'Home'}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
