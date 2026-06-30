import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const getLocalizedText = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || field.fr || field.rw || '';
};

/* ═══════════════════════════════════════════════════════════════
   TTS Provider Chain — tries each provider until one succeeds
   Priority: OpenAI TTS → Google Cloud TTS → Groq (Playai TTS)
═══════════════════════════════════════════════════════════════ */

/**
 * Try OpenAI TTS
 */
async function tryOpenAITTS(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey });

  const mp3Response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova',
    input: text,
    response_format: 'mp3',
    speed: 0.78,
  });

  return Buffer.from(await mp3Response.arrayBuffer());
}

/**
 * Try Google Cloud TTS using the Gemini API key
 * Works via REST — no extra SDK needed
 */
async function tryGoogleTTS(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const body = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-F',
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.85,
      pitch: 0,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return Buffer.from(data.audioContent, 'base64');
}

/**
 * Try Groq PlayAI TTS
 * Groq offers PlayAI TTS via their audio/speech endpoint
 */
async function tryGroqTTS(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'playai-tts',
      input: text,
      voice: 'Arista-PlayAI',
      response_format: 'mp3',
      speed: 0.85,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq TTS ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Try all TTS providers in order, return { buffer, provider } or null
 */
async function generateTTSWithFallback(text) {
  const providers = [
    { name: 'OpenAI', fn: tryOpenAITTS },
    { name: 'Google Cloud TTS', fn: tryGoogleTTS },
    { name: 'Groq PlayAI', fn: tryGroqTTS },
  ];

  for (const provider of providers) {
    try {
      const buffer = await provider.fn(text);
      if (buffer) {
        return { buffer, provider: provider.name };
      }
    } catch (error) {
      console.warn(`[TTS Fallback] ${provider.name} failed: ${error.message}. Trying next...`);
      continue;
    }
  }

  return null;
}

/**
 * Generate and store narration audio for an exhibition or artifact.
 * Runs in the background — does not block the API response.
 * Falls back through OpenAI → Google TTS → Groq PlayAI.
 */
export async function generateAudioForEntity(entityType, entityId) {
  try {
    let narrationText = '';
    let entity;

    if (entityType === 'exhibition') {
      entity = await Exhibition.findById(entityId).lean();
      if (!entity) return;

      // Skip if admin already uploaded narration audio
      const hasUploadedAudio = entity.narration?.full?.en || entity.narration?.full?.fr || entity.narration?.full?.rw;
      if (hasUploadedAudio) {
        console.log(`Skipping audio generation for exhibition ${entityId} — admin-uploaded audio exists`);
        return;
      }

      narrationText = `Welcome! You're looking at ${getLocalizedText(entity.title)}. `;
      const desc = getLocalizedText(entity.fullDescription || entity.description);
      if (desc) narrationText += desc + ' ';
      const significance = getLocalizedText(entity.historicalSignificance);
      if (significance) narrationText += significance;
    } else if (entityType === 'artifact') {
      entity = await Artifact.findById(entityId).lean();
      if (!entity) return;

      narrationText = `Welcome! You're looking at ${getLocalizedText(entity.name)}. `;
      const desc = getLocalizedText(entity.description);
      if (desc) narrationText += desc + ' ';
      const story = getLocalizedText(entity.historicalStory);
      if (story) narrationText += story + ' ';
      const origin = getLocalizedText(entity.originLocation);
      if (origin) narrationText += `This artifact originates from ${origin}. `;
      if (entity.dateCreated) narrationText += `It dates back to ${entity.dateCreated}.`;
    }

    if (!narrationText || narrationText.length < 20) return;

    // Truncate to avoid excessive TTS costs
    if (narrationText.length > 4000) narrationText = narrationText.slice(0, 4000);

    const result = await generateTTSWithFallback(narrationText);

    if (!result) {
      console.error(`Audio generation failed for ${entityType} ${entityId}: all TTS providers exhausted`);
      return;
    }

    // Upload to Cloudinary
    const { url: audioUrl } = await uploadToCloudinary(result.buffer, {
      folder: 'museum/narrations',
      resource_type: 'video',
      public_id: `narration-${entityType}-${entityId}`,
      overwrite: true,
      format: 'mp3',
    });

    if (entityType === 'exhibition') {
      await Exhibition.findByIdAndUpdate(entityId, { narrationAudioUrl: audioUrl });
    } else {
      await Artifact.findByIdAndUpdate(entityId, { narrationAudioUrl: audioUrl });
    }

    console.log(`Audio generated for ${entityType} ${entityId} via ${result.provider}: ${audioUrl}`);
  } catch (error) {
    console.error(`Audio generation failed for ${entityType} ${entityId}:`, error.message);
  }
}

// Export for reuse in aiController narrate endpoint
export { generateTTSWithFallback };
