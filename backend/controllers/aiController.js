import OpenAI from 'openai';
import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import { asyncHandler } from '../utils/errors.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/* ═══════════════════════════════════════════════════════════════
   Multi-Provider AI — automatic fallback chain

   Priority: GPT-4o → Gemini 2.0 Flash → Groq (Llama 4 Scout)

   All three use OpenAI-compatible APIs, so we reuse the same
   `openai` npm package with different baseURL + apiKey.
═══════════════════════════════════════════════════════════════ */

const providers = [
  {
    name: 'gpt-4o',
    model: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
    baseURL: undefined, // default OpenAI
    supportsImageUrl: true,
  },
  {
    name: 'gemini-2.0-flash',
    model: 'gemini-2.0-flash',
    envKey: 'GEMINI_API_KEY',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    supportsImageUrl: true,
  },
  {
    name: 'groq-llama-4-scout',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    envKey: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    supportsImageUrl: true,
  },
];

// Build a client for a specific provider
const getClient = (provider) => {
  const key = process.env[provider.envKey];
  if (!key) return null;
  return new OpenAI({
    apiKey: key,
    ...(provider.baseURL && { baseURL: provider.baseURL }),
  });
};

// Get available providers (ones that have API keys configured)
const getAvailableProviders = () => providers.filter(p => process.env[p.envKey]);

const getLocalizedText = (field, lang = 'en') => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || field.fr || field.rw || '';
};

// Build context string with both exhibitions and artifacts
const buildMuseumContext = async () => {
  const [exhibitions, artifacts] = await Promise.all([
    Exhibition.find({ status: 'published' }, 'title shortDescription tags').lean(),
    Artifact.find({ status: 'published' }, 'name description category').lean(),
  ]);

  const exhibitionList = exhibitions.map(e =>
    `[EXHIBITION] ID: ${e._id} | Title: ${getLocalizedText(e.title)} | Description: ${getLocalizedText(e.shortDescription)} | Tags: ${(e.tags || []).join(', ')}`
  ).join('\n');

  const artifactList = artifacts.map(a =>
    `[ARTIFACT] ID: ${a._id} | Name: ${getLocalizedText(a.name)} | Description: ${getLocalizedText(a.description)} | Category: ${a.category || 'uncategorized'}`
  ).join('\n');

  return { exhibitionList, artifactList };
};

// Check if an error is a quota/rate-limit/auth failure (should trigger fallback)
const shouldFallback = (error) => {
  const status = error?.status || error?.response?.status;
  // 429 = rate limit, 402 = payment required, 401 = invalid key, 403 = forbidden, 503 = service unavailable
  if ([429, 402, 401, 403, 503].includes(status)) return true;
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('billing') ||
      msg.includes('exceeded') || msg.includes('insufficient') || msg.includes('limit')) return true;
  return false;
};

// Build the system prompt for identification
const buildSystemPrompt = (exhibitionList, artifactList) => `You are an AI museum guide for the Kandt House Museum in Kigali, Rwanda. The museum focuses on natural history, taxonomy, and the history of Richard Kandt.

When shown an image, identify which museum exhibition OR artifact it matches from the lists below. Check BOTH exhibitions and artifacts.

If you find a match, respond in this exact JSON format:
{"matched": true, "entityType": "exhibition" or "artifact", "entityId": "<the item's ID>", "confidence": "high|medium|low", "description": "<a rich 2-3 sentence narration about this item suitable for audio playback, written as if you are a friendly female museum guide speaking to a visitor>"}

If no match is found, still try to identify what's in the image and provide helpful information:
{"matched": false, "entityType": null, "entityId": null, "confidence": "none", "description": "<a 2-3 sentence description of what you see in the image and any relevant museum context, spoken as a friendly female museum guide>"}

IMPORTANT: Respond ONLY with valid JSON, no markdown or extra text.

Museum exhibitions:
${exhibitionList}

Museum artifacts:
${artifactList}`;

/* ═══════════════════════════════════════════════════════════════
   Core identification — tries each provider in priority order
═══════════════════════════════════════════════════════════════ */
const runIdentification = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  const availableProviders = getAvailableProviders();
  if (availableProviders.length === 0) {
    return res.status(503).json({
      message: 'No AI providers configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY to your environment.',
    });
  }

  const base64Image = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype;
  const { exhibitionList, artifactList } = await buildMuseumContext();
  const systemPrompt = buildSystemPrompt(exhibitionList, artifactList);

  let lastError = null;
  let usedProvider = null;

  // Try each provider in order
  for (const provider of availableProviders) {
    const client = getClient(provider);
    if (!client) continue;

    try {
      const response = await client.chat.completions.create({
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please identify this museum artifact, specimen, or exhibition:' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            ],
          },
        ],
        max_tokens: 500,
      });

      usedProvider = provider.name;
      const aiText = response.choices[0].message.content.trim();

      let result;
      try {
        const cleaned = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result = JSON.parse(cleaned);
      } catch {
        result = { matched: false, entityType: null, entityId: null, confidence: 'none', description: aiText };
      }

      // Backward compat: if old-format response has exhibitionId but no entityType
      if (result.exhibitionId && !result.entityType) {
        result.entityType = 'exhibition';
        result.entityId = result.exhibitionId;
      }

      // Fetch full entity data (gracefully handle invalid/missing IDs)
      let entity = null;
      if (result.matched && result.entityId) {
        try {
          if (result.entityType === 'artifact') {
            entity = await Artifact.findById(result.entityId).lean();
          } else {
            entity = await Exhibition.findById(result.entityId).lean();
          }
        } catch {
          entity = null;
        }

        if (!entity) {
          result.matched = false;
          result.confidence = 'none';
          if (!result.description) {
            result.description = 'This item was detected but could not be found in our museum collection. It may not be catalogued yet.';
          }
        }
      }

      return res.json({
        matched: result.matched,
        entityType: result.matched ? (result.entityType || null) : null,
        entityId: result.matched ? (result.entityId || null) : null,
        confidence: result.confidence,
        description: result.description,
        entity: entity || null,
        provider: usedProvider,
        // Backward compat fields
        exhibitionId: result.entityType === 'exhibition' && entity ? result.entityId : null,
        exhibition: result.entityType === 'exhibition' ? entity : null,
      });

    } catch (error) {
      lastError = error;
      console.warn(`[AI Fallback] ${provider.name} failed: ${error.message || error.status}. Trying next provider...`);

      if (shouldFallback(error)) {
        continue; // Try next provider
      }
      // Non-quota error (e.g., network timeout) — still try next provider
      continue;
    }
  }

  // All providers failed
  console.error('[AI Fallback] All providers exhausted.', lastError?.message);
  return res.status(503).json({
    message: 'All AI services are currently unavailable. Please try again later.',
    providers: availableProviders.map(p => p.name),
  });
};

// @desc    Upload image, identify exhibition/artifact via vision AI (admin/guide)
// @route   POST /api/ai/identify
export const identifyExhibit = asyncHandler(async (req, res) => {
  return runIdentification(req, res);
});

// @desc    Upload image, identify exhibition/artifact via vision AI (visitor-accessible)
// @route   POST /api/ai/identify-visitor
export const identifyVisitor = asyncHandler(async (req, res) => {
  return runIdentification(req, res);
});

// Helper: build narration text from request body
const buildNarrationText = async (body) => {
  const { text, exhibitionId, artifactId, lang = 'en' } = body;

  if (text) return text;

  if (exhibitionId) {
    const exhibition = await Exhibition.findById(exhibitionId).lean();
    if (!exhibition) return null;
    let t = `Welcome! You're looking at ${getLocalizedText(exhibition.title, lang)}. `;
    const desc = getLocalizedText(exhibition.fullDescription || exhibition.description, lang);
    if (desc) t += desc + ' ';
    const significance = getLocalizedText(exhibition.historicalSignificance, lang);
    if (significance) t += significance;
    return t;
  }

  if (artifactId) {
    const artifact = await Artifact.findById(artifactId).lean();
    if (!artifact) return null;
    let t = `Welcome! You're looking at ${getLocalizedText(artifact.name, lang)}. `;
    const desc = getLocalizedText(artifact.description, lang);
    if (desc) t += desc + ' ';
    const story = getLocalizedText(artifact.historicalStory, lang);
    if (story) t += story + ' ';
    const origin = getLocalizedText(artifact.originLocation, lang);
    if (origin) t += `This artifact originates from ${origin}. `;
    if (artifact.dateCreated) t += `It dates back to ${artifact.dateCreated}.`;
    return t;
  }

  return null;
};

/* ═══════════════════════════════════════════════════════════════
   TTS Narration — multi-provider fallback chain
   Priority: OpenAI TTS → Google Cloud TTS → Groq PlayAI → text
═══════════════════════════════════════════════════════════════ */
export const narrateExhibit = asyncHandler(async (req, res) => {
  const { lang = 'en' } = req.body;

  const narrationText = await buildNarrationText(req.body);
  if (!narrationText) {
    return res.status(400).json({ message: 'No text, exhibitionId, or artifactId provided' });
  }

  // Import the shared TTS fallback chain
  const { generateTTSWithFallback } = await import('../jobs/audioGeneration.js');

  const result = await generateTTSWithFallback(narrationText);

  if (result) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(result.buffer);

    // Background: upload to Cloudinary for caching
    uploadToCloudinary(result.buffer, {
      folder: 'museum/narrations',
      resource_type: 'video',
      public_id: `narration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      format: 'mp3',
    }).catch(() => {});

    return;
  }

  // All TTS providers failed — return text for browser Speech Synthesis
  console.warn('[TTS] All providers exhausted. Returning text narration.');
  res.json({ text: narrationText, fallback: true });
});
