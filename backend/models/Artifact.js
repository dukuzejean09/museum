import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  description: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  historicalDetails: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  type: {
    type: String,
    enum: ['object', 'image', 'document', 'location', 'specimen'],
    default: 'object',
  },
  images: [String],
  coverImage: String,
  year: String,
  origin: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  stats: {
    views: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

artifactSchema.index({ status: 1 });
artifactSchema.index({ tags: 1 });
artifactSchema.index({ type: 1 });
artifactSchema.index({ 'title.en': 'text', 'description.en': 'text' });

export default mongoose.model('Artifact', artifactSchema);
