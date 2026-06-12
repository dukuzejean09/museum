import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import Exhibition from '../models/Exhibition.js';
import { asyncHandler } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// @desc    Upload image, identify exhibition via GPT-4o vision
// @route   POST /api/ai/identify
export const identifyExhibit = asyncHandler(async (req, res) => {
  let imagePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const openai = getOpenAI();
    imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Fetch all exhibitions for context
    const exhibitions = await Exhibition.find({ status: 'published' }, 'title shortDescription tags').lean();
    const exhibitionList = exhibitions.map(e =>
      `ID: ${e._id} | Title: ${getLocalizedText(e.title)} | Description: ${getLocalizedText(e.shortDescription)} | Tags: ${(e.tags || []).join(', ')}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI museum guide for the Kandt House Museum in Kigali, Rwanda. The museum focuses on natural history, taxonomy, and the history of Richard Kandt.

When shown an image, identify which museum exhibition it matches from the list below. If you find a match, respond in this exact JSON format:
{"matched": true, "exhibitionId": "<the exhibition's ID>", "confidence": "high|medium|low", "description": "<a rich 2-3 sentence narration about this exhibition suitable for audio playback, written as if you are a friendly female museum guide speaking to a visitor>"}

If no match is found, still try to identify what's in the image and provide helpful information:
{"matched": false, "exhibitionId": null, "confidence": "none", "description": "<a 2-3 sentence description of what you see in the image and any relevant museum context, spoken as a friendly female museum guide>"}

IMPORTANT: Respond ONLY with valid JSON, no markdown or extra text.

Museum exhibitions:
${exhibitionList}`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please identify this museum artifact or specimen:' },
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
      result = { matched: false, exhibitionId: null, confidence: 'none', description: aiText };
    }

    // If matched, fetch full exhibition data
    let exhibition = null;
    if (result.matched && result.exhibitionId) {
      exhibition = await Exhibition.findById(result.exhibitionId).lean();
    }

    // Clean up uploaded file
    await fs.unlink(imagePath).catch(() => {});

    res.json({
      ...result,
      exhibition: exhibition || null,
    });
  } catch (error) {
    // Clean up on error too
    if (imagePath) await fs.unlink(imagePath).catch(() => {});

    if (error.message === 'OPENAI_API_KEY is not configured') {
      return res.status(503).json({ message: 'AI service is not configured. Please contact the administrator.' });
    }
    throw error;
  }
});

// @desc    Generate TTS audio for exhibition description
// @route   POST /api/ai/narrate
export const narrateExhibit = asyncHandler(async (req, res) => {
  try {
    const { text, exhibitionId } = req.body;
    const openai = getOpenAI();

    let narrationText = text;

    if (exhibitionId && !text) {
      const exhibition = await Exhibition.findById(exhibitionId).lean();
      if (!exhibition) return res.status(404).json({ message: 'Exhibition not found' });

      narrationText = `Welcome! You're looking at ${getLocalizedText(exhibition.title)}. `;
      const desc = getLocalizedText(exhibition.fullDescription || exhibition.description);
      if (desc) narrationText += desc + ' ';
      const significance = getLocalizedText(exhibition.historicalSignificance);
      if (significance) narrationText += significance;
    }

    if (!narrationText) {
      return res.status(400).json({ message: 'No text or exhibitionId provided' });
    }

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: narrationText,
      response_format: 'mp3',
    });

    const audioFileName = `narration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
    const audioPath = path.join(__dirname, '..', 'uploads', audioFileName);
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    await fs.writeFile(audioPath, buffer);

    res.json({
      audioUrl: `/uploads/${audioFileName}`,
      text: narrationText,
    });
  } catch (error) {
    if (error.message === 'OPENAI_API_KEY is not configured') {
      return res.status(503).json({ message: 'AI service is not configured. Please contact the administrator.' });
    }
    throw error;
  }
});
