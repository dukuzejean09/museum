import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { translate } from '../services/translationService';
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
  // Stores live-translated content: key → translated string
  const [liveTranslations, setLiveTranslations] = useState({});
  // Track in-flight translation requests to avoid duplicates
  const pendingRef = useRef(new Set());

  const setLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      // Clear live translations when language changes — they'll be re-fetched
      setLiveTranslations({});
      pendingRef.current.clear();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }, [lang]);

  /**
   * UI string translation — looks up static translation keys from JSON files.
   */
  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  /**
   * Content localization — extracts the correct language from a
   * multilingual database object like { en: "...", fr: "...", rw: "..." }.
   *
   * If the current language is missing, it immediately returns the best
   * available fallback AND fires an async HF API translation in the
   * background. Once the translation arrives, a re-render shows the
   * real translated text.
   */
  const getLocalized = useCallback((field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;

    // If the target language exists in the DB object, use it directly
    if (field[lang] && field[lang].trim()) return field[lang];

    // Find best available source text
    const srcLang = field.en ? 'en' : field.fr ? 'fr' : field.rw ? 'rw' : null;
    if (!srcLang) return '';
    const srcText = field[srcLang];
    if (!srcText || !srcText.trim()) return '';

    // If we already have a live translation for this text, return it
    const cacheKey = `${srcLang}|${lang}|${srcText}`;
    if (liveTranslations[cacheKey]) return liveTranslations[cacheKey];

    // Fire async translation (only once per unique text)
    if (!pendingRef.current.has(cacheKey)) {
      pendingRef.current.add(cacheKey);
      translate(srcText, srcLang, lang, 'content').then((translated) => {
        if (translated && translated !== srcText) {
          setLiveTranslations((prev) => ({ ...prev, [cacheKey]: translated }));
        }
        pendingRef.current.delete(cacheKey);
      }).catch(() => {
        pendingRef.current.delete(cacheKey);
      });
    }

    // Return fallback immediately while translation loads
    return srcText;
  }, [lang, liveTranslations]);

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
