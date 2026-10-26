import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    role: {
      type: String,
      default: 'Budget Buddy Member',
      trim: true
    },
    company: {
      type: String,
      default: 'Verified User',
      trim: true
    },
    quote: {
      type: String,
      required: [true, 'Praise message is required'],
      trim: true
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

testimonialSchema.index({ rating: -1, createdAt: -1 });

export default mongoose.model('Testimonial', testimonialSchema);
