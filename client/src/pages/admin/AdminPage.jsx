import { useState } from 'react';
import { Users, Server, Activity } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';

export const AdminPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              SYSTEM CONTROL & GOVERNANCE
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              ADMIN <span className="italic text-[#088fff]">CONSOLE</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold font-mono">Active Accounts</span>
              <Users className="w-4 h-4 text-[#088fff]" />
            </div>
            <span className="text-3xl font-editorial font-bold text-[#1A1A1A]">500,420</span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold font-mono">System Throughput</span>
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-3xl font-editorial font-bold text-[#1A1A1A]">99.98%</span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold font-mono">Gemini AI Latency</span>
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-3xl font-editorial font-bold text-[#1A1A1A]">120ms</span>
          </div>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default AdminPage;
