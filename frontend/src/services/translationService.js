/**
 * Frontend Translation Service
 *
 * Provides client-side caching, batching, and debouncing for translation requests.
 * Uses the backend /api/translate endpoints which proxy to HuggingFace NLLB.
 */

import { translateText as apiTranslate, translateBatch as apiTranslateBatch } from '../api';

// ──────────────────────────────────────────────────────────────
// In-memory translation cache (survives within session)
// ──────────────────────────────────────────────────────────────
const memoryCache = new Map();
const MAX_CACHE_SIZE = 2000;

const getCacheKey = (text, srcLang, tgtLang) => `${srcLang}|${tgtLang}|${text}`;

const getFromCache = (text, srcLang, tgtLang) => {
  const key = getCacheKey(text, srcLang, tgtLang);
  return memoryCache.get(key) || null;
};

const setInCache = (text, srcLang, tgtLang, translated) => {
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entries (first 500)
    const keys = Array.from(memoryCache.keys());
    keys.slice(0, 500).forEach(k => memoryCache.delete(k));
  }
  const key = getCacheKey(text, srcLang, tgtLang);
  memoryCache.set(key, translated);
};

// Also persist to localStorage for cross-session caching
const LS_CACHE_KEY = 'museum_translation_cache';
const LS_MAX_ENTRIES = 500;

const loadLSCache = () => {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw);
    entries.forEach(([key, value]) => memoryCache.set(key, value));
  } catch { /* ignore */ }
};

const saveLSCache = () => {
  try {
    const entries = Array.from(memoryCache.entries()).slice(-LS_MAX_ENTRIES);
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
};

// Load cache on init
loadLSCache();

// Persist periodically
let saveTimer = null;
const scheduleSave = () => {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveLSCache();
    saveTimer = null;
  }, 5000);
};

// ──────────────────────────────────────────────────────────────
// Pending request deduplication
// ──────────────────────────────────────────────────────────────
const pendingRequests = new Map();

// ──────────────────────────────────────────────────────────────
// Translate a single text
// ──────────────────────────────────────────────────────────────
export const translate = async (text, sourceLang, targetLang, context = 'general') => {
  if (!text || !text.trim() || sourceLang === targetLang) return text;

  // Check memory cache
  const cached = getFromCache(text, sourceLang, targetLang);
  if (cached) return cached;

  // Deduplicate in-flight requests
  const dedupKey = getCacheKey(text, sourceLang, targetLang);
  if (pendingRequests.has(dedupKey)) {
    return pendingRequests.get(dedupKey);
  }

  const promise = (async () => {
    try {
      const { data } = await apiTranslate({
        text,
        sourceLang,
        targetLang,
        context,
      });
      const translated = data.translated;
      setInCache(text, sourceLang, targetLang, translated);
      scheduleSave();
      return translated;
    } catch (err) {
      console.warn('Translation failed, returning original:', err.message);
      return text;
    } finally {
      pendingRequests.delete(dedupKey);
    }
  })();

  pendingRequests.set(dedupKey, promise);
  return promise;
};

// ──────────────────────────────────────────────────────────────
// Batch translate multiple texts
// ──────────────────────────────────────────────────────────────
export const translateMultiple = async (texts, sourceLang, targetLang, context = 'general') => {
  if (sourceLang === targetLang) return texts;

  const results = new Array(texts.length);
  const uncachedTexts = [];
  const uncachedIndices = [];

  // Check cache first
  texts.forEach((text, i) => {
    if (!text || !text.trim()) {
      results[i] = text;
      return;
    }
    const cached = getFromCache(text, sourceLang, targetLang);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(i);
    }
  });

  // If all cached, return immediately
  if (uncachedTexts.length === 0) return results;

  try {
    const { data } = await apiTranslateBatch({
      texts: uncachedTexts,
      sourceLang,
      targetLang,
      context,
    });

    data.translations.forEach((translated, j) => {
      const idx = uncachedIndices[j];
      results[idx] = translated;
      setInCache(uncachedTexts[j], sourceLang, targetLang, translated);
    });
    scheduleSave();
  } catch (err) {
    console.warn('Batch translation failed, using originals:', err.message);
    uncachedIndices.forEach((idx, j) => {
      results[idx] = uncachedTexts[j];
    });
  }

  return results;
};

// ──────────────────────────────────────────────────────────────
// Get localized text from a multilingual content object
// This is the primary helper for displaying DB content
// ──────────────────────────────────────────────────────────────
export const getLocalizedText = (field, lang) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

// ──────────────────────────────────────────────────────────────
// Clear caches
// ──────────────────────────────────────────────────────────────
export const clearTranslationCache = () => {
  memoryCache.clear();
  localStorage.removeItem(LS_CACHE_KEY);
};

export default {
  translate,
  translateMultiple,
  getLocalizedText,
  clearTranslationCache,
};
