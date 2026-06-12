import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['view', 'scan', 'audio_play', 'audio_complete', 'trail_click', 'share', 'search', 'bookmark', 'qr_scan'],
    required: true,
  },
  entityType: {
    type: String,
    enum: ['exhibition', 'trail', 'story'],
    required: true,
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  visitorId: { type: String, default: null }, // visitor token hash or user ID
  metadata: {
    duration: Number, // seconds spent
    source: String, // 'qr', 'search', 'trail', 'browse', 'recommendation'
    device: String, // 'mobile', 'desktop', 'tablet'
    language: String,
    searchQuery: String,
    referrer: String,
  },
  timestamp: { type: Date, default: Date.now },
});

analyticsEventSchema.index({ timestamp: -1 });
analyticsEventSchema.index({ entityType: 1, entityId: 1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // TTL: 1 year

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
