import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  visitorName: { type: String, default: '', trim: true },
  visitorEmail: { type: String, default: '' },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  ratings: {
    exhibitions: { type: Number, min: 1, max: 5, default: null },
    staff: { type: Number, min: 1, max: 5, default: null },
    facilities: { type: Number, min: 1, max: 5, default: null },
    accessibility: { type: Number, min: 1, max: 5, default: null },
  },
  favoriteExhibition: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', default: null },
  favoriteExhibitionName: String,
  visitDuration: String,
  wouldRecommend: { type: Boolean, default: true },
  responses: [{
    question: String,
    answer: String,
  }],
  comments: { type: String, maxlength: 2000 },
  language: { type: String, default: 'en' },
}, { timestamps: true });

surveySchema.index({ overallRating: 1 });

export default mongoose.model('Survey', surveySchema);
