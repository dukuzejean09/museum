import { translateText, translateBatch, detectLanguage } from '../services/translationService.js';

// POST /api/translate
// Body: { text, sourceLang?, targetLang, context? }
export const translate = async (req, res, next) => {
  try {
    const { text, sourceLang, targetLang, context } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ message: 'text and targetLang are required' });
    }

    const src = sourceLang || detectLanguage(text);
    const translated = await translateText(text, src, targetLang, context || 'general');

    res.json({
      original: text,
      translated,
      sourceLang: src,
      targetLang,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/translate/batch
// Body: { texts: string[], sourceLang?, targetLang, context? }
export const translateBatchHandler = async (req, res, next) => {
  try {
    const { texts, sourceLang, targetLang, context } = req.body;

    if (!Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ message: 'texts (array) and targetLang are required' });
    }

    if (texts.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 texts per batch request' });
    }

    const src = sourceLang || (texts[0] ? detectLanguage(texts[0]) : 'en');
    const translated = await translateBatch(texts, src, targetLang, context || 'general');

    res.json({
      translations: translated,
      sourceLang: src,
      targetLang,
      count: translated.length,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/translate/detect
// Body: { text }
export const detectLang = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'text is required' });
    }

    const detected = detectLanguage(text);
    res.json({ language: detected, text: text.slice(0, 100) });
  } catch (err) {
    next(err);
  }
};
