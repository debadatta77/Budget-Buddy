import mongoose from 'mongoose';

const vaultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  current: {
    type: Number,
    default: 0,
    min: 0
  },
  target: {
    type: Number,
    default: 100000,
    min: 0
  }
}, {
  timestamps: true
});

export const Vault = mongoose.model('Vault', vaultSchema);
export default Vault;
