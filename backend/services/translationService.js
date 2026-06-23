import crypto from 'crypto';
import TranslationCache from '../models/TranslationCache.js';

// ──────────────────────────────────────────────────────────────
// Hugging Face NLLB language codes
// NLLB uses FLORES-200 codes, not standard ISO codes
// ──────────────────────────────────────────────────────────────
const NLLB_LANG_CODES = {
  en: 'eng_Latn',
  fr: 'fra_Latn',
  rw: 'kin_Latn',
};

const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M';

// ──────────────────────────────────────────────────────────────
// Proper nouns and terms that should be preserved as-is
// ──────────────────────────────────────────────────────────────
const PRESERVED_TERMS = [
  // Museum names
  'Kandt House', 'Kandt', 'Richard Kandt',
  // Rwandan places
  'Kigali', 'Butare', 'Huye', 'Nyanza', 'Musanze', 'Gisenyi', 'Kibuye',
  'Rubavu', 'Karongi', 'Muhanga', 'Ruhengeri', 'Lake Kivu', 'Volcanoes National Park',
  'Nyungwe', 'Akagera',
  // Historical figures
  'Yuhi V Musinga', 'Mutara III Rudahigwa', 'Kigeli V Ndahindurwa',
  'Mwami', 'Umwami',
  // Cultural terms
  'Imigongo', 'Agaseke', 'Igisoro', 'Intore', 'Umuganda', 'Umuganura',
  'Inyambo', 'Ingoma', 'Inanga', 'Ikembe', 'Umuduri',
  'Urwagwa', 'Ikigage', 'Igikoma',
  // Museum/Heritage terms
  'UNESCO', 'ICOM',
];

// Build regex for preserved terms (case-insensitive, word-boundary)
const PRESERVED_REGEX = new RegExp(
  `\\b(${PRESERVED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

// ──────────────────────────────────────────────────────────────
// Hash function for cache key
// ──────────────────────────────────────────────────────────────
const makeHash = (text, srcLang, tgtLang, context) => {
  return crypto
    .createHash('sha256')
    .update(`${srcLang}|${tgtLang}|${context}|${text}`)
    .digest('hex');
};

// ──────────────────────────────────────────────────────────────
// Preprocessing: protect proper nouns with placeholders
// ──────────────────────────────────────────────────────────────
const preprocess = (text) => {
  const placeholders = {};
  let idx = 0;
  const processed = text.replace(PRESERVED_REGEX, (match) => {
    const key = `__PRSV${idx}__`;
    placeholders[key] = match;
    idx++;
    return key;
  });
  return { processed, placeholders };
};

// ──────────────────────────────────────────────────────────────
// Postprocessing: restore proper nouns from placeholders
// ──────────────────────────────────────────────────────────────
const postprocess = (text, placeholders) => {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }
  return result;
};

// ──────────────────────────────────────────────────────────────
// Call Hugging Face NLLB API
// ──────────────────────────────────────────────────────────────
const callNLLB = async (text, srcLang, tgtLang) => {
  const apiKey = process.env.HF_API_TOKEN;
  if (!apiKey) {
    throw new Error('HF_API_TOKEN not configured');
  }

  const srcCode = NLLB_LANG_CODES[srcLang];
  const tgtCode = NLLB_LANG_CODES[tgtLang];

  if (!srcCode || !tgtCode) {
    throw new Error(`Unsupported language pair: ${srcLang} → ${tgtLang}`);
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      parameters: {
        src_lang: srcCode,
        tgt_lang: tgtCode,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    // Model loading — retry after delay
    if (response.status === 503) {
      throw new Error('MODEL_LOADING');
    }
    throw new Error(`NLLB API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();

  // HF returns [{ translation_text: "..." }]
  if (Array.isArray(data) && data[0]?.translation_text) {
    return data[0].translation_text;
  }

  throw new Error('Unexpected NLLB response format');
};

// ──────────────────────────────────────────────────────────────
// Simple language detection heuristic
// ──────────────────────────────────────────────────────────────
const LANG_INDICATORS = {
  fr: /\b(le|la|les|des|du|un|une|dans|est|sont|avec|pour|sur|qui|que|cette|ces|nous|vous|ils|elles|mais|ou|donc|car|ni|très|aussi|bien|même|fait|été|avoir|être|peut|faire|tout|tous|comme|entre|après|autre|aux|peu|encore|sans|sous|chez|depuis)\b/gi,
  rw: /\b(ni|mu|ku|na|cy|by|ry|nk|bw|mw|kw|aba|umu|iki|iki|uru|aka|ubu|uku|aha|ibi|utu|ama|imi|in|iz|amaz|ubw|ukw|ahag|ibiy|utw|imig|agas|ubug|ukug|ahak|ibig|utug|icyi|iry|urw|akaz|ubuz|ukuz|ahaz)\b/gi,
  en: /\b(the|is|are|was|were|have|has|had|been|being|will|would|could|should|this|that|these|those|which|what|where|when|who|whom|whose|there|their|they|them|from|with|into|about|than|then|also|just|only|both|each|much|many|some|such|more|most|very|well|even|still|already|always|never)\b/gi,
};

export const detectLanguage = (text) => {
  if (!text || text.length < 10) return 'en';

  const scores = {};
  for (const [lang, regex] of Object.entries(LANG_INDICATORS)) {
    const matches = text.match(regex);
    scores[lang] = matches ? matches.length : 0;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  // If top score is 0 or tied, default to English
  if (sorted[0][1] === 0) return 'en';
  return sorted[0][0];
};

// ──────────────────────────────────────────────────────────────
// Translate a single text string
// ──────────────────────────────────────────────────────────────
export const translateText = async (text, sourceLang, targetLang, context = 'general') => {
  // No-op if same language or empty
  if (!text || !text.trim()) return text;
  if (sourceLang === targetLang) return text;

  const hash = makeHash(text.trim(), sourceLang, targetLang, context);

  // Check cache first
  try {
    const cached = await TranslationCache.findOneAndUpdate(
      { hash },
      { $inc: { hitCount: 1 }, $set: { lastUsedAt: new Date() } },
      { new: true }
    );
    if (cached) return cached.translatedText;
  } catch (err) {
    console.warn('Translation cache lookup failed:', err.message);
  }

  // Preprocess — protect proper nouns
  const { processed, placeholders } = preprocess(text.trim());

  // Call NLLB
  let translated;
  let retries = 0;
  while (retries < 2) {
    try {
      translated = await callNLLB(processed, sourceLang, targetLang);
      break;
    } catch (err) {
      if (err.message === 'MODEL_LOADING' && retries < 1) {
        // Wait for model to load on HF infrastructure
        await new Promise(r => setTimeout(r, 20000));
        retries++;
        continue;
      }
      console.error(`Translation failed (${sourceLang}→${targetLang}):`, err.message);
      return text; // fallback to original
    }
  }

  if (!translated) return text;

  // Postprocess — restore proper nouns
  const final = postprocess(translated, placeholders);

  // Store in cache (fire-and-forget)
  TranslationCache.create({
    hash,
    sourceText: text.trim(),
    sourceLang,
    targetLang,
    translatedText: final,
    context,
    lastUsedAt: new Date(),
  }).catch(err => console.warn('Translation cache write failed:', err.message));

  return final;
};

// ──────────────────────────────────────────────────────────────
// Batch translate multiple texts
// ──────────────────────────────────────────────────────────────
export const translateBatch = async (items, sourceLang, targetLang, context = 'general') => {
  if (sourceLang === targetLang) return items;

  const results = [];
  // Check cache for all items first
  const uncached = [];
  const uncachedIndices = [];

  for (let i = 0; i < items.length; i++) {
    const text = items[i];
    if (!text || !text.trim()) {
      results[i] = text;
      continue;
    }

    const hash = makeHash(text.trim(), sourceLang, targetLang, context);
    try {
      const cached = await TranslationCache.findOneAndUpdate(
        { hash },
        { $inc: { hitCount: 1 }, $set: { lastUsedAt: new Date() } },
        { new: true }
      );
      if (cached) {
        results[i] = cached.translatedText;
        continue;
      }
    } catch (err) {
      // cache miss
    }

    uncached.push(text);
    uncachedIndices.push(i);
    results[i] = null; // placeholder
  }

  // Translate uncached items (in parallel, max 5 concurrent)
  const CONCURRENCY = 5;
  for (let batch = 0; batch < uncached.length; batch += CONCURRENCY) {
    const chunk = uncached.slice(batch, batch + CONCURRENCY);
    const chunkIndices = uncachedIndices.slice(batch, batch + CONCURRENCY);

    const translations = await Promise.allSettled(
      chunk.map(text => translateText(text, sourceLang, targetLang, context))
    );

    translations.forEach((result, j) => {
      const idx = chunkIndices[j];
      results[idx] = result.status === 'fulfilled' ? result.value : items[idx];
    });
  }

  return results;
};

// ──────────────────────────────────────────────────────────────
// Translate a content object (e.g. { en: "...", fr: "...", rw: "..." })
// Fills in missing language fields
// ──────────────────────────────────────────────────────────────
export const translateContentObject = async (contentObj, context = 'general') => {
  if (!contentObj || typeof contentObj === 'string') return contentObj;

  const languages = ['en', 'fr', 'rw'];
  const result = { ...contentObj };

  // Find which languages already have content
  const existing = languages.filter(l => result[l] && result[l].trim());
  const missing = languages.filter(l => !result[l] || !result[l].trim());

  if (existing.length === 0 || missing.length === 0) return result;

  // Use the first available language as source
  const srcLang = existing[0];
  const srcText = result[srcLang];

  // Translate to each missing language
  for (const tgtLang of missing) {
    try {
      result[tgtLang] = await translateText(srcText, srcLang, tgtLang, context);
    } catch (err) {
      console.warn(`Failed to translate ${srcLang}→${tgtLang}:`, err.message);
      result[tgtLang] = srcText; // fallback
    }
  }

  return result;
};

export default {
  translateText,
  translateBatch,
  translateContentObject,
  detectLanguage,
};
