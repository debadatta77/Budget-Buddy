import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import GeminiAdvisorChat from '../../components/ai/GeminiAdvisorChat';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';

export const AiAdvisorPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
            AI FINANCIAL INTELLIGENCE SUITE
          </span>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
            GEMINI <span className="italic text-[#088fff]">ADVISOR</span>
          </h1>
          <p className="mt-3 text-sm text-[#1A1A1A]/70 max-w-lg mx-auto">
            Get instant, personalized guidance on budgeting, savings, debt management, and category limits powered by Gemini AI.
          </p>
        </div>

        <div className="shadow-2xl rounded-sm overflow-hidden">
          <GeminiAdvisorChat />
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default AiAdvisorPage;
