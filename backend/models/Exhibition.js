import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  year: Number,
  event: {
    en: String,
    fr: String,
    rw: String,
  },
}, { _id: false });

const exhibitionSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  shortDescription: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  fullDescription: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  historicalSignificance: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  timeline: [timelineEntrySchema],
  media: {
    images: [String],
    videos: [String],
    documents: [String],
  },
  narration: {
    full: { en: String, fr: String, rw: String },
    preview: { en: String, fr: String, rw: String },
  },
  coverImage: String,
  accessLevel: {
    type: String,
    enum: ['public_preview', 'authenticated', 'museum_access'],
    default: 'museum_access',
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
  },
  artifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' }],
  tags: [String],
  order: { type: Number, default: 0 },
  stats: {
    views: { type: Number, default: 0 },
    audioPlays: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  narrationAudioUrl: { type: String, default: null },
}, { timestamps: true });

exhibitionSchema.index({ status: 1 });
exhibitionSchema.index({ tags: 1 });
exhibitionSchema.index({ 'title.en': 'text', 'shortDescription.en': 'text' });

export default mongoose.model('Exhibition', exhibitionSchema);
