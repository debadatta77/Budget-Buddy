import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      default: 'Feedback / Inquiry',
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    status: {
      type: String,
      enum: ['New', 'Reviewed', 'Resolved', 'Under Review', 'Pending', 'Closed'],
      default: 'New'
    },
    source: {
      type: String,
      default: 'Contact Form / Web'
    },
    ticketId: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['inquiry', 'complaint', 'feedback', 'bug'],
      default: 'inquiry'
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    complaintCategory: {
      type: String,
      trim: true,
      default: ''
    },
    isSample: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({ createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
