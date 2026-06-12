import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  visitType: {
    type: String,
    enum: ['physical', 'online'],
    default: 'physical',
  },
  // Guide is required for physical tours, optional for online
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', index: true },
  visitorName: { type: String, required: true, trim: true },
  visitorEmail: { type: String, required: true, lowercase: true, trim: true },
  visitorPhone: String,
  date: { type: Date, required: true },
  time: { type: String }, // HH:MM format — required for physical only
  endTime: String,
  timezone: { type: String, default: 'Africa/Kigali' },
  groupSize: { type: Number, default: 1, min: 1, max: 50 },
  language: { type: String, default: 'en' },
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
  },
  rejectionReason: String,
  confirmationSentAt: Date,
  message: String,
  referenceNumber: { type: String, unique: true },
  // Linked access code (generated when an online booking is confirmed)
  accessCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessCode' },
}, { timestamps: true });

// Generate reference number before save
bookingSchema.pre('save', function () {
  if (!this.referenceNumber) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.referenceNumber = `BK-${dateStr}-${rand}`;
  }
});

bookingSchema.index({ guideId: 1, date: 1 });
bookingSchema.index({ status: 1 });

export default mongoose.model('Booking', bookingSchema);
