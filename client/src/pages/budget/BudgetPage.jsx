import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { BudgetSavingsSection } from '../savings/BudgetSavingsSection';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';

export const BudgetPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A]">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />
      <main className="pt-24">
        <BudgetSavingsSection />
      </main>
      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default BudgetPage;
