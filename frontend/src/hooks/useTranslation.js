/**
 * useTranslation hook
 *
 * Provides dynamic content translation with automatic language tracking.
 * For DB content that only has one language populated, this hook can
 * translate it on-the-fly using the backend NLLB service.
 *
 * Usage:
 *   const { translateContent, getLocalized, translating } = useTranslation();
 *
 *   // For multilingual DB objects: { en: "...", fr: "...", rw: "..." }
 *   const title = getLocalized(artifact.name);
 *
 *   // For on-demand translation of any text:
 *   const translated = await translateContent("Hello world", "en");
 */

import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { translate, translateMultiple, getLocalizedText } from '../services/translationService';

const useTranslation = () => {
  const { lang } = useLanguage();
  const [translating, setTranslating] = useState(false);
  const abortRef = useRef(null);

  /**
   * Get localized text from a multilingual field object.
   * Falls back through: current lang → en → fr → rw → ''
   */
  const getLocalized = useCallback((field) => {
    return getLocalizedText(field, lang);
  }, [lang]);

  /**
   * Translate text on-demand from sourceLang to the current language.
   * Returns the translated string or original on failure.
   */
  const translateContent = useCallback(async (text, sourceLang, context = 'general') => {
    if (!text || sourceLang === lang) return text;
    setTranslating(true);
    try {
      return await translate(text, sourceLang, lang, context);
    } finally {
      setTranslating(false);
    }
  }, [lang]);

  /**
   * Batch translate multiple texts from sourceLang to current language.
   */
  const translateBatch = useCallback(async (texts, sourceLang, context = 'general') => {
    if (sourceLang === lang) return texts;
    setTranslating(true);
    try {
      return await translateMultiple(texts, sourceLang, lang, context);
    } finally {
      setTranslating(false);
    }
  }, [lang]);

  /**
   * Translate a content object, filling in missing language fields.
   * If the object already has the current language, returns that directly.
   * Otherwise, translates from the best available source language.
   */
  const translateField = useCallback(async (field, context = 'general') => {
    if (!field) return '';
    if (typeof field === 'string') return field;

    // If current language exists, use it
    if (field[lang] && field[lang].trim()) return field[lang];

    // Find best source
    const srcLang = field.en ? 'en' : field.fr ? 'fr' : field.rw ? 'rw' : null;
    if (!srcLang) return '';

    const srcText = field[srcLang];
    return translateContent(srcText, srcLang, context);
  }, [lang, translateContent]);

  return {
    lang,
    translating,
    getLocalized,
    translateContent,
    translateBatch,
    translateField,
  };
};

export default useTranslation;
