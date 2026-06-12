import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { lang, setLang, LANGUAGES } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition text-sm"
      >
        <Globe size={16} className="text-amber-600" />
        <span className="text-slate-600 dark:text-slate-300">{current?.flag} {current?.code.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-50">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-slate-700 flex items-center gap-2 ${
                lang === l.code ? 'text-amber-600 font-medium' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
