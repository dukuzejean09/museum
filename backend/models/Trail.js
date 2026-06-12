import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact', required: true },
  description: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
}, { _id: false });

const trailSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  introduction: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  description: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  coverImage: String,

  // Ordered stops — each stop references an artifact
  stops: [stopSchema],

  // Discovery metadata
  tags: [String],
  estimatedMinutes: { type: Number, default: 30 },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'detailed'],
    default: 'easy',
  },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },

  stats: {
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

trailSchema.index({ isActive: 1, priority: -1 });
trailSchema.index({ isFeatured: 1 });

export default mongoose.model('Trail', trailSchema);
