import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  image: String,
  description: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  historicalStory: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  dateCreated: { type: String, default: '' },
  dateDiscovered: { type: String, default: '' },
  originLocation: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  category: { type: String, default: '' },
  additionalImages: [String],
  audio: String,
  video: String,
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
artifactSchema.index({ category: 1 });
artifactSchema.index({ 'name.en': 'text', 'description.en': 'text' });

export default mongoose.model('Artifact', artifactSchema);
