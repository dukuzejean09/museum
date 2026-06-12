import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from './ErrorBoundary';
import { useLanguage } from '../i18n/LanguageContext';
import { MapPin, ClipboardList, Image, Users, Compass } from 'lucide-react';
import { ImigongoBorder, AgasekeIcon, IngomaIcon, ImigongoDivider } from './RwandanPatterns';

const Footer = () => {
  const { t } = useLanguage();

  const quickLinks = [
    { to: '/exhibitions', label: t('nav.exhibitions') || 'Exhibitions', icon: Image },
    { to: '/trail', label: t('nav.trail'), icon: Compass },
    { to: '/map', label: t('nav.map'), icon: MapPin },
    { to: '/guides', label: t('nav.guides'), icon: Users },
    { to: '/feedback', label: t('nav.feedback'), icon: ClipboardList },
  ];

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* Imigongo cultural band at the top of footer */}
      <ImigongoBorder />

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-amber-400 mb-3">Kandt House Museum</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              {t('home.subtitle')}
            </p>
            {/* Cultural icons row */}
            <div className="flex items-center gap-3 text-amber-600/60">
              <AgasekeIcon size={22} />
              <IngomaIcon size={22} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition py-1"
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Visit Info */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Visit Us</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p>KN 82 St, Kigali, Rwanda</p>
              <p>Mon - Sat: 9:00 AM - 5:00 PM</p>
              <p>Sun: 10:00 AM - 4:00 PM</p>
            </div>
          </div>

          {/* Rwandan Heritage */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Rwandan Heritage</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Preserving Rwanda's natural history, cultural heritage, and the legacy of exploration since 1907.
            </p>
            <p className="text-xs text-amber-600/50 mt-3 italic">
              "Ubumwe, Umurimo, Gukunda Igihugu"
            </p>
          </div>
        </div>

        <ImigongoDivider className="my-6 text-amber-500" />

        <div className="text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Kandt House Museum of Natural History, Kigali, Rwanda. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
