import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="page-container py-20 text-center">
      <h1 className="text-7xl font-extrabold text-amber-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-200 mb-2">
        {t('error.notFound') || 'Page Not Found'}
      </h2>
      <p className="text-slate-400 mb-8 max-w-md mx-auto">
        {t('error.notFoundDesc') || "The page you're looking for doesn't exist or has been moved."}
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline btn-md"
        >
          <ArrowLeft size={18} /> {t('common.back') || 'Go Back'}
        </button>
        <Link
          to="/home"
          className="btn btn-primary btn-md"
        >
          <Home size={18} /> {t('nav.home') || 'Home'}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
