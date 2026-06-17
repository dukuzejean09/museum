import OpenAI from 'openai';
import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import { asyncHandler } from '../utils/errors.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

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

// Shared identification logic used by both admin and visitor endpoints
const runIdentification = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const openai = getOpenAI();
    // multer uses memory storage — image is in req.file.buffer, not on disk
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const { exhibitionList, artifactList } = await buildMuseumContext();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI museum guide for the Kandt House Museum in Kigali, Rwanda. The museum focuses on natural history, taxonomy, and the history of Richard Kandt.

When shown an image, identify which museum exhibition OR artifact it matches from the lists below. Check BOTH exhibitions and artifacts.

If you find a match, respond in this exact JSON format:
{"matched": true, "entityType": "exhibition" or "artifact", "entityId": "<the item's ID>", "confidence": "high|medium|low", "description": "<a rich 2-3 sentence narration about this item suitable for audio playback, written as if you are a friendly female museum guide speaking to a visitor>"}

If no match is found, still try to identify what's in the image and provide helpful information:
{"matched": false, "entityType": null, "entityId": null, "confidence": "none", "description": "<a 2-3 sentence description of what you see in the image and any relevant museum context, spoken as a friendly female museum guide>"}

IMPORTANT: Respond ONLY with valid JSON, no markdown or extra text.

Museum exhibitions:
${exhibitionList}

Museum artifacts:
${artifactList}`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please identify this museum artifact, specimen, or exhibition:' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      max_tokens: 500,
    });

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

    // Fetch full entity data
    let entity = null;
    if (result.matched && result.entityId) {
      if (result.entityType === 'artifact') {
        entity = await Artifact.findById(result.entityId).lean();
      } else {
        entity = await Exhibition.findById(result.entityId).lean();
      }
    }

    res.json({
      matched: result.matched,
      entityType: result.entityType || null,
      entityId: result.entityId || null,
      confidence: result.confidence,
      description: result.description,
      entity: entity || null,
      // Backward compat fields
      exhibitionId: result.entityType === 'exhibition' ? result.entityId : null,
      exhibition: result.entityType === 'exhibition' ? entity : null,
    });
  } catch (error) {
    if (error.message === 'OPENAI_API_KEY is not configured') {
      return res.status(503).json({ message: 'AI service is not configured. Please contact the administrator.' });
    }
    throw error;
  }
};

// @desc    Upload image, identify exhibition/artifact via GPT-4o vision (admin/guide)
// @route   POST /api/ai/identify
export const identifyExhibit = asyncHandler(async (req, res) => {
  return runIdentification(req, res);
});

// @desc    Upload image, identify exhibition/artifact via GPT-4o vision (visitor-accessible)
// @route   POST /api/ai/identify-visitor
export const identifyVisitor = asyncHandler(async (req, res) => {
  return runIdentification(req, res);
});

// @desc    Generate TTS audio for exhibition or artifact description
// @route   POST /api/ai/narrate
export const narrateExhibit = asyncHandler(async (req, res) => {
  try {
    const { text, exhibitionId, artifactId, lang = 'en' } = req.body;
    const openai = getOpenAI();

    let narrationText = text;

    if (exhibitionId && !text) {
      const exhibition = await Exhibition.findById(exhibitionId).lean();
      if (!exhibition) return res.status(404).json({ message: 'Exhibition not found' });

      narrationText = `Welcome! You're looking at ${getLocalizedText(exhibition.title, lang)}. `;
      const desc = getLocalizedText(exhibition.fullDescription || exhibition.description, lang);
      if (desc) narrationText += desc + ' ';
      const significance = getLocalizedText(exhibition.historicalSignificance, lang);
      if (significance) narrationText += significance;
    }

    if (artifactId && !text && !exhibitionId) {
      const artifact = await Artifact.findById(artifactId).lean();
      if (!artifact) return res.status(404).json({ message: 'Artifact not found' });

      narrationText = `Welcome! You're looking at ${getLocalizedText(artifact.name, lang)}. `;
      const desc = getLocalizedText(artifact.description, lang);
      if (desc) narrationText += desc + ' ';
      const story = getLocalizedText(artifact.historicalStory, lang);
      if (story) narrationText += story + ' ';
      const origin = getLocalizedText(artifact.originLocation, lang);
      if (origin) narrationText += `This artifact originates from ${origin}. `;
      if (artifact.dateCreated) narrationText += `It dates back to ${artifact.dateCreated}.`;
    }

    if (!narrationText) {
      return res.status(400).json({ message: 'No text, exhibitionId, or artifactId provided' });
    }

    // Select voice based on language — 'nova' for English, 'alloy' for French/Kinyarwanda
    // 'alloy' has a more neutral accent that works better for non-English content
    const voice = (lang === 'fr' || lang === 'rw') ? 'alloy' : 'nova';

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice,
      input: narrationText,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    const { url: audioUrl } = await uploadToCloudinary(buffer, {
      folder: 'museum/narrations',
      resource_type: 'video',
      public_id: `narration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      format: 'mp3',
    });

    res.json({
      audioUrl,
      text: narrationText,
    });
  } catch (error) {
    if (error.message === 'OPENAI_API_KEY is not configured') {
      return res.status(503).json({ message: 'AI service is not configured. Please contact the administrator.' });
    }
    throw error;
  }
});
