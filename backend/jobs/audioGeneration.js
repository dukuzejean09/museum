import Exhibition from '../models/Exhibition.js';
import Artifact from '../models/Artifact.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const getLocalizedText = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || field.fr || field.rw || '';
};

/**
 * Generate and store narration audio for an exhibition or artifact.
 * Runs in the background — does not block the API response.
 */
export async function generateAudioForEntity(entityType, entityId) {
  try {
    const { default: OpenAI } = await import('openai');

    if (!process.env.OPENAI_API_KEY) return;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: narrationText,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Upload to Cloudinary
    const { url: audioUrl } = await uploadToCloudinary(buffer, {
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

    console.log(`Audio generated for ${entityType} ${entityId}: ${audioUrl}`);
  } catch (error) {
    console.error(`Audio generation failed for ${entityType} ${entityId}:`, error.message);
  }
}
