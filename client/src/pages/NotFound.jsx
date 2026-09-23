import { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { GetStartedModal } from '../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../components/modals/CardCustomizerModal';

export const NotFoundPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean flex flex-col justify-between">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-36 pb-24 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="text-[10px] uppercase font-mono tracking-[0.3em] font-bold text-rose-600 block mb-2">
          404 ERROR • PAGE NOT FOUND
        </span>
        <h1 className="text-4xl font-editorial font-bold text-[#1A1A1A] mb-4">
          RESOURCE UNRESOLVED
        </h1>
        <p className="text-sm text-[#1A1A1A]/70 mb-8 leading-relaxed font-light">
          The financial ledger route you requested does not exist or has been relocated.
        </p>

        <a
          href="/"
          className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3.5 px-6 rounded-sm transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </a>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default NotFoundPage;
