import Testimonial from '../models/Testimonial.js';

/**
 * GET /api/v1/testimonials
 * Fetches the best 5 real user praise messages (sorted by highest rating and newest)
 */
export const getTopTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({})
      .sort({ rating: -1, createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve testimonials',
      error: error.message
    });
  }
};

/**
 * POST /api/v1/testimonials
 * Records a new genuine user praise message
 */
export const createTestimonial = async (req, res) => {
  try {
    const { author, role, company, quote, rating, avatar, userId } = req.body;

    if (!author || !author.trim() || !quote || !quote.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Author name and review message are required.'
      });
    }

    const trimmedAuthor = author.trim();
    const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedAuthor)}&background=088fff&color=fff`;

    const testimonial = await Testimonial.create({
      userId: req.user?.id || req.user?._id || userId || null,
      author: trimmedAuthor,
      role: role && role.trim() ? role.trim() : 'Budget Buddy Member',
      company: company && company.trim() ? company.trim() : 'Verified User',
      quote: quote.trim(),
      rating: Number(rating) && Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : 5,
      avatar: avatar && avatar.trim() ? avatar.trim() : initialsAvatar
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been submitted.',
      data: testimonial
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save testimonial',
      error: error.message
    });
  }
};
