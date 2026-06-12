import { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';

const translations = { en, fr, rw };

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
];

const LanguageContext = createContext();

const detectLanguage = () => {
  const saved = localStorage.getItem('lang');
  if (saved && translations[saved]) return saved;
  const browser = navigator.language?.slice(0, 2);
  if (browser === 'fr') return 'fr';
  if (browser === 'rw') return 'rw';
  return 'en';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(detectLanguage);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
