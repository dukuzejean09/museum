import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'guide'],
    default: 'admin',
  },
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    avatar: String,
    phone: String,
  },
  settings: {
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
  },
  isActive: { type: Boolean, default: true },
  isProtected: { type: Boolean, default: false },
  lastLoginAt: Date,
}, { timestamps: true });

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

export default mongoose.model('Admin', adminSchema);
