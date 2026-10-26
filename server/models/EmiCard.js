import mongoose from 'mongoose';

const emiCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide loan/card title'],
    trim: true
  },
  cardLabel: {
    type: String,
    default: 'LOAN LEDGER'
  },
  dueDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 15
  },
  amount: {
    type: String,
    required: true
  },
  numericAmount: {
    type: Number,
    required: true,
    min: 0
  },
  latency: {
    type: String,
    default: 'Auto-Debit Active'
  },
  themeGradient: {
    type: String,
    default: 'linear-gradient(135deg, #030712 0%, #0284C7 50%, #2563EB 100%)'
  },
  themeKey: {
    type: String,
    default: 'blue'
  },
  cardNumber: {
    type: String,
    default: '•••• •••• •••• 4821'
  },
  cardType: {
    type: String,
    default: 'PERSONAL LOAN EMI'
  },
  holderName: {
    type: String,
    default: ''
  },
  principal: {
    type: Number,
    default: 0
  },
  annualRate: {
    type: Number,
    default: 0
  },
  tenureMonths: {
    type: Number,
    default: 0
  },
  paidInstallments: {
    type: Number,
    default: 0
  },
  lastPaidDate: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const EmiCard = mongoose.model('EmiCard', emiCardSchema);
export default EmiCard;
