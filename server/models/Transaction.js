import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide transaction title'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please specify category'],
    default: 'General'
  },
  amount: {
    type: Number,
    required: [true, 'Please specify transaction amount'],
    min: 0
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type must be income or expense']
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for lightning-fast user ledger queries ordered by date
transactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
