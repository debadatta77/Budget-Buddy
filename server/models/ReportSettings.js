import mongoose from 'mongoose';

const reportSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    default: 'MONTH_END'
  },
  format: {
    type: String,
    default: 'PDF_AND_HTML'
  },
  sections: {
    cashFlowCharts: { type: Boolean, default: true },
    categoryBreakdown: { type: Boolean, default: true },
    rule503020: { type: Boolean, default: true },
    aiAdvisorInsights: { type: Boolean, default: true },
    transactionLedger: { type: Boolean, default: true }
  },
  lastSent: {
    type: Date,
    default: null
  },
  nextScheduled: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export const ReportSettings = mongoose.model('ReportSettings', reportSettingsSchema);
export default ReportSettings;
