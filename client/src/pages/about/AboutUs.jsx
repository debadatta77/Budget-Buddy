import { useState } from 'react';
import { Layers, PieChart, ShieldCheck } from 'lucide-react';

export const AboutUs = () => {
  const [, setHoveredCard] = useState(null);

  return (
    <section id="about" className="bg-[#F9F8F5] text-[#1A1A1A] py-12 lg:py-16 border-b border-[#1A1A1A]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 pb-8 border-b border-[#1A1A1A]/10">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#088fff]/10 text-[#088fff] text-xs font-semibold uppercase tracking-wider mb-3">
              About Budget Buddy
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
              Getting to <br />
              <span className="italic text-[#088fff]">Know</span> Our Mission
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="text-base sm:text-lg text-[#1A1A1A]/80 font-light leading-relaxed font-sans-clean">
              We are more than just a financial service provider; we are your trusted partner in navigating the complexities of finance.
            </p>
          </div>
        </div>

        {/* 3 Authentic & Credible Bento Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Card 1: 6-in-1 Integrated Financial Suite */}
          <div
            id="about-card-architecture"
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#088fff] text-[#F9F8F5] p-8 lg:p-10 flex flex-col justify-between shadow-xl rounded-sm hover:-translate-y-1 transition-all duration-300 min-h-[380px] relative overflow-hidden group"
          >
            <div className="flex items-center justify-between z-10 border-b border-white/20 pb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">
                Metric 01 • Architecture
              </span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="my-8 z-10">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight font-editorial text-[#F9F8F5] leading-none">
                  6-in-1
                </span>
                <span className="text-2xl sm:text-3xl italic font-editorial text-[#F9F8F5]/90">
                  suite
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 z-10">
              <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold block mb-1 font-mono">
                Integrated Financial Engines
              </span>
              <p className="text-xs sm:text-sm text-[#F9F8F5]/90 font-light leading-relaxed font-sans-clean">
                Telemetry Dashboard, Expense Ledger, 50/30/20 Budgeting, EMI Studio, Deep Analytics, and Gemini AI Advisor in one unified platform.
              </p>
            </div>
          </div>

          {/* Card 2: 50/30/20 Wealth Allocation Framework */}
          <div
            id="about-card-efficiency"
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#1A1A1A] text-[#F9F8F5] p-8 lg:p-10 flex flex-col justify-between shadow-xl rounded-sm hover:-translate-y-1 transition-all duration-300 min-h-[380px] relative overflow-hidden group border border-[#1A1A1A]"
          >
            <div className="flex items-center justify-between z-10 border-b border-white/10 pb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                Metric 02 • Framework
              </span>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                <PieChart className="w-3.5 h-3.5 text-[#088fff]" />
              </div>
            </div>

            <div className="my-8 z-10">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight font-editorial text-white leading-none">
                50/30/20
              </span>
            </div>

            <div className="pt-4 border-t border-white/10 z-10">
              <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold block mb-1 font-mono">
                Wealth Allocation Engine
              </span>
              <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed font-sans-clean">
                Automated monthly budget categorization into Needs (50%), Wants (30%), and Savings (20%) with interactive Emergency Vault targets.
              </p>
            </div>
          </div>

          {/* Card 3: 100% Privacy & Zero Hidden Costs */}
          <div
            id="about-card-atms"
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-white text-[#1A1A1A] p-8 lg:p-10 flex flex-col justify-between shadow-md rounded-sm hover:-translate-y-1 transition-all duration-300 min-h-[380px] border border-[#1A1A1A]/15 group"
          >
            <div className="flex items-center justify-between z-10 border-b border-[#1A1A1A]/10 pb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60">
                Metric 03 • Privacy & Transparency
              </span>
              <div className="w-6 h-6 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>

            <div className="my-8 z-10">
              <span className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-none">
                100%
              </span>
            </div>

            <div className="pt-4 border-t border-[#1A1A1A]/10 z-10">
              <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 font-bold block mb-1 font-mono">
                Zero Fees & Complete Privacy
              </span>
              <p className="text-xs sm:text-sm text-[#1A1A1A]/70 font-light leading-relaxed font-sans-clean">
                Free to use with zero hidden subscriptions, encrypted database storage, and immediate real-time financial telemetry calculations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
