import mongoose from 'mongoose';

const linkedAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountType: { type: String, required: true },
  numberMasked: { type: String, required: true },
  status: { type: String, default: 'VERIFIED' }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide user name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide user email'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false // Exclude from default queries for security
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  currency: {
    type: String,
    default: 'INR (₹)'
  },
  planTier: {
    type: String,
    default: 'Pro Member'
  },
  region: {
    type: String,
    default: 'India (IN)'
  },
  accountUid: {
    type: String,
    default: () => `BUDDY-${Date.now().toString(36).toUpperCase()}`
  },
  linkedAccounts: [linkedAccountSchema]
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
export default User;
