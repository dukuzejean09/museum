import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSelector = ({ variant = 'default' }) => {
  const { lang, setLang, LANGUAGES } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-amber-900/20 transition text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label={`Language: ${current?.label}. Click to change language.`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe size={16} className="text-amber-600" />
        <span className="text-slate-400">
          {current?.flag} {current?.code.toUpperCase()}
        </span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700 py-1 min-w-[160px] z-50"
          role="listbox"
          aria-label="Select language"
        >
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              role="option"
              aria-selected={lang === l.code}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-900/20 flex items-center gap-2 transition-colors ${
                lang === l.code ? 'text-amber-600 font-medium bg-amber-50/50' : 'text-slate-300'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.nativeName && l.nativeName !== l.label && (
                <span className="text-[10px] text-slate-400 ml-auto">{l.nativeName}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
