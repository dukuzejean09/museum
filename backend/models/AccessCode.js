import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema({
  usedAt: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String,
}, { _id: false });

const accessCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  label: { type: String, default: '' },
  type: {
    type: String,
    enum: ['physical', 'virtual', 'promotional', 'staff'],
    default: 'physical',
  },
  maxUses: { type: Number, default: null },
  timesUsed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  validFrom: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  duration: { type: Number, default: 3 }, // hours of access granted
  usageLog: [usageLogSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
});

accessCodeSchema.index({ isActive: 1 });

export default mongoose.model('AccessCode', accessCodeSchema);
