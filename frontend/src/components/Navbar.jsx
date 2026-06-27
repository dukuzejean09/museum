import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import { useVisitor } from '../context/VisitorContext';
import { Menu, X, Clock, ScanLine } from 'lucide-react';

const navBg = 'bg-slate-900';
const border = 'border-slate-800';
const linkBase = 'px-3 py-2 rounded-lg transition-colors font-medium text-amber-400 hover:bg-amber-400/10 hover:text-amber-300';
const linkActive = 'px-3 py-2 rounded-lg transition-colors font-medium bg-amber-400/15 text-amber-200';

const formatCountdown = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '0:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatTime = (date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AccessTimer = () => {
  const { remainingTime, sessionStart, expiresAt } = useVisitor();
  const { t } = useLanguage();
  if (!remainingTime || remainingTime <= 0) return null;

  const isLow = remainingTime <= 300; // 5 minutes
  const isVeryLow = remainingTime <= 60; // 1 minute

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
      isVeryLow ? 'text-red-400 bg-red-400/15 animate-pulse' : isLow ? 'text-red-400 bg-red-400/10' : 'text-amber-400/70 bg-amber-400/5'
    }`}>
      <Clock size={12} />
      <span className="font-mono">{formatCountdown(remainingTime)}</span>
      {sessionStart && expiresAt && (
        <span className="hidden sm:inline text-[10px] opacity-60 ml-1">
          ({formatTime(sessionStart)} — {formatTime(expiresAt)})
        </span>
      )}
    </div>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  const navLinks = [
    { to: '/home', label: t('nav.home') },
    { to: '/exhibitions', label: t('nav.exhibitions') },
    { to: '/artifacts', label: t('nav.artifacts') || 'Artifacts' },
    { to: '/trails', label: t('nav.trails') || 'Trails' },
    { to: '/stories', label: t('nav.stories') || 'Stories' },
    { to: '/guides', label: t('nav.guides') },
    { to: '/feedback', label: t('nav.feedback') },
    { to: '/search', label: t('nav.search') },
    { to: '/ar', label: t('nav.ar') || 'AR', icon: ScanLine },
  ];

  const isActive = (path) =>
    location.pathname === path || (path !== '/home' && location.pathname.startsWith(path));

  const linkClass = (path) => isActive(path) ? linkActive : linkBase;

  return (
    <nav className={`${navBg} shadow-sm border-b ${border} sticky top-0 z-40`}>
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/home" className="text-xl font-bold text-amber-400">
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
