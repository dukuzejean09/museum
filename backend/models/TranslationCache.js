import mongoose from 'mongoose';

const translationCacheSchema = new mongoose.Schema({
  // Hash of sourceText + sourceLang + targetLang for fast lookups
  hash: { type: String, required: true, unique: true, index: true },
  sourceText: { type: String, required: true },
  sourceLang: { type: String, required: true, enum: ['en', 'fr', 'rw'] },
  targetLang: { type: String, required: true, enum: ['en', 'fr', 'rw'] },
  translatedText: { type: String, required: true },
  // Context hint used for translation (e.g. 'museum_description', 'artifact_name')
  context: { type: String, default: 'general' },
  // Track usage for analytics
  hitCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// TTL index — expire unused translations after 90 days
translationCacheSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound index for common query pattern
translationCacheSchema.index({ sourceLang: 1, targetLang: 1 });

export default mongoose.model('TranslationCache', translationCacheSchema);
