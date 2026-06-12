import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import { useVisitor } from '../context/VisitorContext';
import { Menu, X, Sun, Moon, Clock } from 'lucide-react';

const navBg = 'bg-slate-900';
const border = 'border-slate-800';
const linkBase = 'px-3 py-2 rounded-lg transition-colors font-medium text-amber-400 hover:bg-amber-400/10 hover:text-amber-300';
const linkActive = 'px-3 py-2 rounded-lg transition-colors font-medium bg-amber-400/15 text-amber-200';

const DarkModeToggle = () => {
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-full text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10 transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const AccessTimer = () => {
  const { remainingTime } = useVisitor();
  const { t } = useLanguage();
  if (!remainingTime) return null;

  const hours = Math.floor(remainingTime / 60);
  const minutes = remainingTime % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const isLow = remainingTime <= 15;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
      isLow ? 'text-red-400 bg-red-400/10' : 'text-amber-400/70 bg-amber-400/5'
    }`}>
      <Clock size={12} />
      {timeStr} {t('gateway.remaining')}
    </span>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/exhibitions', label: t('nav.exhibitions') },
    { to: '/artifacts', label: t('nav.artifacts') || 'Artifacts' },
    { to: '/trails', label: t('nav.trails') || 'Trails' },
    { to: '/guides', label: t('nav.guides') },
    { to: '/feedback', label: t('nav.feedback') },
    { to: '/search', label: t('nav.search') },
  ];

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const linkClass = (path) => isActive(path) ? linkActive : linkBase;

  return (
    <nav className={`${navBg} shadow-sm border-b ${border} sticky top-0 z-40`}>
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-amber-400">
          Kandt Museum
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1 text-sm">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)}>
              {l.label}
            </Link>
          ))}
          <AccessTimer />
          <LanguageSelector />
          <DarkModeToggle />
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2 text-amber-400" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={`lg:hidden border-t ${border} ${navBg} px-4 pb-4`}>
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`text-sm ${linkClass(l.to)}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className={`flex items-center gap-3 mt-3 pt-3 border-t ${border}`}>
            <AccessTimer />
            <LanguageSelector />
            <DarkModeToggle />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
