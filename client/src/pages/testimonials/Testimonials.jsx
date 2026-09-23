import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { testimonials } from '../data/mockData';

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const current = testimonials[currentIndex] || testimonials[0];

  return (
    <section id="testimonials" className="bg-[#F9F8F5] text-[#1A1A1A] py-20 lg:py-28 border-b border-[#1A1A1A]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-4 font-mono">
            CLIENT PERSPECTIVES / VOLUME 04
          </span>

          <div className="relative mb-10 pb-4">
            <blockquote className="text-2xl sm:text-4xl lg:text-[40px] font-editorial font-normal italic text-[#1A1A1A] leading-tight tracking-tight">
              “{current.quote}”
            </blockquote>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-[#1A1A1A]/10">
            <div className="flex items-center gap-4">
              <img
                src={current.avatar}
                alt={current.author}
                className="w-12 h-12 rounded-full object-cover ring-1 ring-[#1A1A1A]/20"
              />
              <div>
                <h4 className="text-base sm:text-lg font-editorial font-bold text-[#1A1A1A] leading-tight">
                  {current.author}
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-mono mt-0.5">
                  {current.role} / {current.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
                className="w-10 h-10 rounded-sm border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextTestimonial}
                aria-label="Next testimonial"
                className="w-10 h-10 rounded-sm border border-[#1A1A1A]/20 hover:border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
