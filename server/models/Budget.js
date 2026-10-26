import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  allocated: { type: Number, required: true, default: 0 },
  color: { type: String, default: '#088fff' }
}, { _id: true });

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  monthlyIncome: {
    type: Number,
    default: 0
  },
  categories: [budgetCategorySchema]
}, {
  timestamps: true
});

export const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
