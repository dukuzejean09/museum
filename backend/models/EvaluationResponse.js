import mongoose from 'mongoose';

const evaluationResponseSchema = new mongoose.Schema({
  visitorName: { type: String, default: '', trim: true },
  visitorEmail: { type: String, default: '' },
  // Satisfaction ratings (1-5)
  overallSatisfaction: { type: Number, required: true, min: 1, max: 5 },
  easeOfUse: { type: Number, min: 1, max: 5, default: null },
  navigationQuality: { type: Number, min: 1, max: 5, default: null },
  arUsefulness: { type: Number, min: 1, max: 5, default: null },
  audioUsefulness: { type: Number, min: 1, max: 5, default: null },
  contentQuality: { type: Number, min: 1, max: 5, default: null },
  // Learning impact
  arImprovedUnderstanding: { type: Boolean, default: null },
  narrationImprovedLearning: { type: Boolean, default: null },
  informationEasierToAccess: { type: Boolean, default: null },
  wouldRecommend: { type: Boolean, default: true },
  // Open-ended
  comments: { type: String, maxlength: 2000 },
  language: { type: String, default: 'en' },
}, { timestamps: true });

evaluationResponseSchema.index({ createdAt: -1 });

export default mongoose.model('EvaluationResponse', evaluationResponseSchema);
