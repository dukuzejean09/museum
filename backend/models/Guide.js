import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '17:00' },
}, { _id: false });

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  bio: { type: String, default: '' },
  languages: [String],
  specializations: [String],
  imageUrl: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', index: true },
  email: String,
  phone: String,
  availability: [availabilitySchema],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

guideSchema.index({ isActive: 1 });

export default mongoose.model('Guide', guideSchema);
