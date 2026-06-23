import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';

const translations = { en, fr, rw };

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Fran\u00E7ais', flag: '\u{1F1EB}\u{1F1F7}', nativeName: 'Fran\u00E7ais', dir: 'ltr' },
  { code: 'rw', label: 'Kinyarwanda', flag: '\u{1F1F7}\u{1F1FC}', nativeName: 'Ikinyarwanda', dir: 'ltr' },
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

/**
 * Get localized text from a multilingual field object or plain string.
 * Fallback chain: lang → en → fr → rw → ''
 */
const getLocalizedText = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(detectLanguage);

  const setLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    // Dispatch custom event so non-React code can respond to language changes
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }, [lang]);

  /**
   * UI string translation — looks up static translation keys from JSON files.
   * For labels, buttons, navigation, and other static UI text.
   */
  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  /**
   * Content localization — extracts the correct language from a
   * multilingual database object like { en: "...", fr: "...", rw: "..." }.
   * For dynamic content from the API (artifacts, exhibitions, etc.)
   */
  const getLocalized = useCallback((field) => {
    return getLocalizedText(field, lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      t,
      getLocalized,
      LANGUAGES,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export { getLocalizedText };
