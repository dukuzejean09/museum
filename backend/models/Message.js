import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  responderName: { type: String, required: true },
  responderRole: { type: String, enum: ['admin', 'guide'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', default: null },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  replies: [replySchema],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'answered', 'closed'],
    default: 'open',
  },
  language: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ status: 1 });
messageSchema.index({ exhibitionId: 1 });
messageSchema.index({ assignedTo: 1 });

export default mongoose.model('Message', messageSchema);
