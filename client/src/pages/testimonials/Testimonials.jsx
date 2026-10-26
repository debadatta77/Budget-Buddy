import { useState, useEffect, useContext } from 'react';
import { ArrowLeft, ArrowRight, Star, MessageSquare, CheckCircle2, X, Send, Sparkles } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { testimonialAPI } from '../../services/apiClient';

export const Testimonials = () => {
  const { user } = useContext(AuthContext);
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const userReviewKey = user ? `budget_buddy_reviewed_${user.id || user._id || user.email}` : null;

  // Modal Form State
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Clean up obsolete global key and evaluate reviewed status for current user
  useEffect(() => {
    try {
      localStorage.removeItem('budget_buddy_user_reviewed');
    } catch {
      // Ignored
    }

    if (!user) {
      setHasReviewed(false);
      return;
    }

    const reviewedLocally = userReviewKey ? localStorage.getItem(userReviewKey) === 'true' : false;
    const reviewedInList = testimonials.some(
      (t) =>
        (t.userId && (t.userId === user.id || t.userId === user._id)) ||
        (user.email && t.email && t.email === user.email) ||
        (user.name && t.author && t.author.trim().toLowerCase() === user.name.trim().toLowerCase())
    );

    setHasReviewed(reviewedLocally || reviewedInList);
  }, [user, userReviewKey, testimonials]);

  // Fetch best 5 real testimonials from backend (or local cache fallback)
  const fetchTestimonials = async () => {
    try {
      const res = await testimonialAPI.getTop();
      if (res?.success && Array.isArray(res?.data)) {
        setTestimonials(res.data);
        localStorage.setItem('budget_buddy_testimonials', JSON.stringify(res.data));
      } else {
        const cached = JSON.parse(localStorage.getItem('budget_buddy_testimonials') || '[]');
        setTestimonials(cached);
      }
    } catch {
      const cached = JSON.parse(localStorage.getItem('budget_buddy_testimonials') || '[]');
      setTestimonials(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Sync author state and previous quote when opening modal
  useEffect(() => {
    if (isReviewModalOpen) {
      const existing = testimonials.find(
        (t) =>
          (user && t.userId && (t.userId === user.id || t.userId === user._id)) ||
          (user?.name && t.author && t.author.trim().toLowerCase() === user.name.trim().toLowerCase())
      );

      setAuthor(user?.name || existing?.author || '');
      setRole(existing?.role || 'Budget Buddy Member');
      setCompany(existing?.company || 'Verified User');
      setQuote(existing?.quote || '');
      setRating(existing?.rating || 5);
      setErrorMsg('');
    }
  }, [isReviewModalOpen, user, testimonials]);

  const prevTestimonial = () => {
    if (testimonials.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const nextTestimonial = () => {
    if (testimonials.length <= 1) return;
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!author.trim() || !quote.trim()) {
      setErrorMsg('Please enter your name and a feedback message.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId: user?._id || user?.id || null,
        author: author.trim(),
        role: role.trim() || 'Budget Buddy Member',
        company: company.trim() || 'Verified User',
        quote: quote.trim(),
        rating: Number(rating) || 5
      };

      await testimonialAPI.create(payload);

      // Mark this specific user as reviewed
      if (userReviewKey) {
        localStorage.setItem(userReviewKey, 'true');
      }
      setHasReviewed(true);

      // Re-fetch top 5 reviews
      await fetchTestimonials();
      setCurrentIndex(0);
      setIsReviewModalOpen(false);
    } catch (err) {
      // Local fallback in case network/offline
      const newReview = {
        _id: Date.now().toString(),
        userId: user?._id || user?.id || null,
        author: author.trim(),
        role: role.trim() || 'Budget Buddy Member',
        company: company.trim() || 'Verified User',
        quote: quote.trim(),
        rating: Number(rating) || 5,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(author.trim())}&background=088fff&color=fff`,
        createdAt: new Date().toISOString()
      };

      const updated = [newReview, ...testimonials].slice(0, 5);
      setTestimonials(updated);
      localStorage.setItem('budget_buddy_testimonials', JSON.stringify(updated));
      if (userReviewKey) {
        localStorage.setItem(userReviewKey, 'true');
      }
      setHasReviewed(true);
      setCurrentIndex(0);
      setIsReviewModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const current = testimonials[currentIndex];

  return (
    <section id="testimonials" className="bg-[#F9F8F5] text-[#1A1A1A] py-12 lg:py-16 border-b border-[#1A1A1A]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centralized Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#088fff]/10 text-[#088fff] text-xs font-semibold uppercase tracking-wider mb-3">
            User Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-editorial font-bold text-[#1A1A1A]">
            What Our Users <span className="italic text-[#088fff]">Say</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-sans-clean mt-2 max-w-md mx-auto">
            Real stories and verified experiences from people managing their wealth with Budget Buddy.
          </p>
        </div>

        {/* Centralized Testimonial Carousel or Empty State */}
        {testimonials.length > 0 && current ? (
          <div className="max-w-3xl mx-auto text-center">
            {/* Rating Stars */}
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < (current.rating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[#1A1A1A]/20'
                  }`}
                />
              ))}
            </div>

            {/* Centralized Quote */}
            <blockquote className="text-xl sm:text-3xl lg:text-[34px] font-editorial font-normal italic text-[#1A1A1A] leading-relaxed tracking-tight mb-8">
              “{current.quote}”
            </blockquote>

            {/* Author Profile */}
            <div className="flex flex-col items-center justify-center gap-2 mb-8">
              <img
                src={current.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.author)}&background=088fff&color=fff`}
                alt={current.author}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#088fff]/20 shadow-xs"
              />
              <h4 className="text-base font-editorial font-bold text-[#1A1A1A]">
                {current.author}
              </h4>
              <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-mono">
                {current.role} {current.company && `• ${current.company}`}
              </p>
            </div>

            {/* Carousel Navigation (Slot 1 to 5) */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#1A1A1A]/10">
              <button
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
                className="w-9 h-9 rounded-sm border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Indicator Dots for up to 5 Slots */}
              <div className="flex items-center gap-1.5">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex ? 'w-6 bg-[#088fff]' : 'w-1.5 bg-[#1A1A1A]/20 hover:bg-[#1A1A1A]/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                aria-label="Next testimonial"
                className="w-9 h-9 rounded-sm border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty State when no real user reviews yet */
          <div className="max-w-xl mx-auto bg-white border border-[#1A1A1A]/10 p-8 rounded-sm text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#088fff]/10 text-[#088fff] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-editorial font-bold text-[#1A1A1A] mb-2">No Reviews Yet</h3>
            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed max-w-md mx-auto">
              Be the first to share your experience with Budget Buddy! Your thoughts will be featured on our community slider.
            </p>
          </div>
        )}

        {/* Centralized User Callout / Thank You Banner (Only shown when user is logged in) */}
        {user && (
          !hasReviewed ? (
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-white border border-[#1A1A1A]/10 rounded-sm shadow-xs text-center">
              <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-1">
                COMMUNITY FEEDBACK
              </span>
              <h3 className="text-lg sm:text-xl font-editorial font-bold text-[#1A1A1A] mb-2">
                Enjoying our platform? Leave a message
              </h3>
              <p className="text-xs text-[#1A1A1A]/70 max-w-md mx-auto mb-5 leading-relaxed">
                Share your experience with fellow users. The top 5 verified reviews are featured live on our homepage.
              </p>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-6 rounded-sm transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Leave Feedback</span>
              </button>
            </div>
          ) : (
            /* Industry standard polite acknowledgement for users who already gave a message */
            <div className="max-w-xl mx-auto mt-8 p-4 bg-emerald-50 border border-emerald-200/80 rounded-sm text-center shadow-xs">
              <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thank you for sharing your feedback! Your review helps us continuously improve Budget Buddy.</span>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="mt-2 text-[10px] uppercase tracking-widest font-mono text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                Update or Submit Another Review
              </button>
            </div>
          )
        )}
      </div>

      {/* Review / Praise Modal */}
      {isReviewModalOpen && (
        <div
          onClick={() => setIsReviewModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-sm animate-fadeIn"
        >
          <div
            className="bg-[#F9F8F5] border border-[#1A1A1A]/20 text-[#1A1A1A] w-full max-w-lg rounded-sm p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-sm bg-[#1A1A1A]/5 hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close review modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-1 font-mono">
                REAL USER FEEDBACK
              </span>
              <h2 className="text-2xl font-editorial font-bold text-[#1A1A1A]">
                LEAVE A <span className="italic text-[#088fff]">REVIEW</span>
              </h2>
              <p className="text-xs text-[#1A1A1A]/60 font-sans-clean mt-1">
                Tell us how Budget Buddy helps you manage your expenses and financial goals.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-mono rounded-sm">
                {errorMsg}
              </div>
            )}

            {/* Review Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1.5 font-mono">
                  Your Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#1A1A1A]/20'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-[#1A1A1A]/70 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>

                {/* Role / Profession */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>
              </div>

              {/* Company / City */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono">
                  Organization / City (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TechCorp or Mumbai"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                />
              </div>

              {/* Praise Quote / Message */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono">
                  Your Message / Feedback *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Budget Buddy helped me streamline my household cash flow and plan my emergency savings effectively..."
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff] resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-white py-3 rounded-sm font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting Review...' : 'Submit Praise'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Testimonials;
