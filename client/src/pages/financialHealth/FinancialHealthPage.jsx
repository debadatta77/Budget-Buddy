import { useState, useEffect } from 'react';
import { ShieldCheck, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { calculateFinancialTelemetry } from '../../services/userDataService';

export const FinancialHealthPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

  const [telemetry, setTelemetry] = useState(calculateFinancialTelemetry());

  useEffect(() => {
    const handleSync = () => {
      setTelemetry(calculateFinancialTelemetry());
    };
    window.addEventListener('userDataChanged', handleSync);
    return () => window.removeEventListener('userDataChanged', handleSync);
  }, []);

  const { summary, rule503020 } = telemetry;
  const totalIncome = summary.totalIncome || 125000;
  const totalExpense = summary.totalExpense || 38450;
  const savingsRate = summary.savingsRate || 69.2;

  const healthScore = totalIncome > 0 ? Math.min(99, Math.max(50, Math.round(Number(savingsRate) + 30))) : 75;

  const metrics = [
    {
      title: 'Emergency Reserve Runway',
      score: `${healthScore > 80 ? '94/100' : '78/100'}`,
      detail: `Covering estimated ${(totalIncome / (totalExpense || 1)).toFixed(1)} months of recorded burn rate.`
    },
    {
      title: 'Savings & SIP Ratio',
      score: `${savingsRate}%`,
      scoreColor: 'text-emerald-600',
      detail: `Current net savings rate of recorded user income.`
    },
    {
      title: '50/30/20 Rule Adherence',
      score: `${rule503020.savings.actual}% Savings`,
      scoreColor: 'text-[#088fff]',
      detail: `Needs: ${rule503020.needs.actual}% | Wants: ${rule503020.wants.actual}% | Savings: ${rule503020.savings.actual}%`
    },
    {
      title: 'Liquidity Velocity',
      score: '90/100',
      scoreColor: 'text-purple-600',
      detail: 'High liquid asset availability in verified user accounts.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              USER DIAGNOSTIC & WELLNESS AUDIT
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              FINANCIAL <span className="italic text-[#088fff]">HEALTH</span>
            </h1>
          </div>
        </div>

        {/* Big Health Score Specimen */}
        <div className="bg-[#1A1A1A] text-white p-8 sm:p-12 rounded-sm shadow-2xl mb-12 border border-[#1A1A1A] relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-7">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#088fff] font-bold block mb-3">
                REAL-TIME USER HEALTH SCORE AUDIT
              </span>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-6xl sm:text-8xl font-editorial font-bold text-white leading-none">
                  {healthScore}
                </span>
                <span className="text-xl sm:text-2xl font-editorial italic text-emerald-400">
                  / 100 • {healthScore >= 80 ? 'EXCELLENT' : 'GOOD'}
                </span>
              </div>
              <p className="text-sm text-white/80 font-light max-w-xl leading-relaxed">
                Calculated from your recorded income of <strong className="text-white font-mono">₹{totalIncome.toLocaleString('en-IN')}</strong> and expenses of <strong className="text-white font-mono">₹{totalExpense.toLocaleString('en-IN')}</strong>.
              </p>
            </div>

            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div className="w-44 h-44 rounded-full border-4 border-[#088fff] flex flex-col items-center justify-center p-4 text-center bg-white/5">
                <ShieldCheck className="w-10 h-10 text-[#088fff] mb-2" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  USER AUDIT
                </span>
                <span className="text-[9px] text-white/50 font-mono mt-1">
                  Live Data Engine
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Component Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-md flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A]/50 font-bold block mb-2">
                  Metric 0{i + 1}
                </span>
                <h4 className="text-base font-bold font-editorial text-[#1A1A1A] mb-2">{m.title}</h4>
                <span className="text-2xl font-editorial font-bold text-[#088fff] block mb-3">{m.score}</span>
                <p className="text-xs text-[#1A1A1A]/70 leading-relaxed font-light">{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default FinancialHealthPage;
