import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', required: true, index: true },
  title: {
    en: { type: String, required: true },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  content: {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    rw: { type: String, default: '' },
  },
  coverImage: String,
  audio: String,
  video: String,
  order: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

storySchema.index({ status: 1 });

export default mongoose.model('Story', storySchema);
