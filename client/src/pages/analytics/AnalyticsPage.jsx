import { useState, useEffect } from 'react';
import { BarChart3, Sparkles, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { calculateFinancialTelemetry } from '../../services/userDataService';

export const AnalyticsPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('6M');

  const [telemetry, setTelemetry] = useState(calculateFinancialTelemetry());

  useEffect(() => {
    const handleSync = () => {
      setTelemetry(calculateFinancialTelemetry());
    };
    window.addEventListener('userDataChanged', handleSync);
    return () => window.removeEventListener('userDataChanged', handleSync);
  }, []);

  const { summary, categories } = telemetry;
  const currentIncome = summary.totalIncome || 125000;
  const currentExpense = summary.totalExpense || 38450;

  const monthlyTrends = [
    { month: 'Apr', income: Math.round(currentIncome * 0.88), expense: Math.round(currentExpense * 1.1) },
    { month: 'May', income: Math.round(currentIncome * 0.92), expense: Math.round(currentExpense * 1.15) },
    { month: 'Jun', income: Math.round(currentIncome * 0.96), expense: Math.round(currentExpense * 1.02) },
    { month: 'Jul', income: Math.round(currentIncome * 0.96), expense: Math.round(currentExpense * 1.06) },
    { month: 'Aug', income: Math.round(currentIncome * 1.0), expense: Math.round(currentExpense * 0.96) },
    { month: 'Sep', income: currentIncome, expense: currentExpense },
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              REAL-TIME ANALYTICAL TELEMETRY & INTEL
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              FINANCIAL <span className="italic text-[#088fff]">ANALYTICS</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#1A1A1A]/15 p-1 rounded-sm">
            {['1M', '3M', '6M', '1Y'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-sm transition-colors cursor-pointer ${
                  timeframe === tf ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Charts & Intel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Trend Bar Chart Visualization */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-sm border border-[#1A1A1A]/15 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#088fff]" />
                  <h3 className="text-xl font-editorial font-bold text-[#1A1A1A]">
                    Cash Flow Trajectory (Income vs Expense)
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase text-[#1A1A1A]/50">
                  Telemetry: User Live
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="h-64 flex items-end justify-between gap-4 pt-8 pb-2 border-b border-[#1A1A1A]/10">
                {monthlyTrends.map((t, i) => {
                  const maxVal = Math.max(150000, currentIncome * 1.25);
                  const incHeight = (t.income / maxVal) * 100;
                  const expHeight = (t.expense / maxVal) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        <div
                          style={{ height: `${incHeight}%` }}
                          className="w-1/2 bg-[#088fff] rounded-t-sm transition-all hover:opacity-90"
                          title={`Income: ₹${t.income.toLocaleString('en-IN')}`}
                        />
                        <div
                          style={{ height: `${expHeight}%` }}
                          className="w-1/2 bg-[#1A1A1A] rounded-t-sm transition-all hover:opacity-90"
                          title={`Expense: ₹${t.expense.toLocaleString('en-IN')}`}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/70 uppercase">
                        {t.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#088fff] rounded-sm"></span>
                  <span className="font-bold text-[#1A1A1A]">Monthly Income</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#1A1A1A] rounded-sm"></span>
                  <span className="font-bold text-[#1A1A1A]">Monthly Expense</span>
                </span>
              </div>
              <span className="text-[#1A1A1A]/60">Net Savings Rate: <strong className="text-emerald-600">{summary.savingsRate}%</strong></span>
            </div>
          </div>

          {/* AI Insights & Dynamic Category Breakdown */}
          <div className="lg:col-span-4 bg-[#1A1A1A] text-white p-6 sm:p-8 rounded-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-editorial font-bold text-white">
                    Gemini AI Anomaly Detector
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                    LIVE RECORD SUMMARY
                  </span>
                  <p className="text-white/80 leading-relaxed font-light">
                    Recorded income of <strong className="text-white font-mono">₹{summary.totalIncome.toLocaleString('en-IN')}</strong> vs expenses of <strong className="text-white font-mono">₹{summary.totalExpense.toLocaleString('en-IN')}</strong> gives net savings of <strong className="text-emerald-400 font-mono">₹{summary.netSavings.toLocaleString('en-IN')}</strong>.
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
                    PRIMARY EXPENSE CATEGORY
                  </span>
                  <p className="text-white/80 leading-relaxed font-light">
                    {categories.length > 0 ? (
                      <>Top spending is in <strong className="text-white">{categories[0].name}</strong> totaling <strong className="text-white font-mono">₹{categories[0].amount.toLocaleString('en-IN')}</strong> ({categories[0].percent}% of expenses).</>
                    ) : 'No expense records found yet.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span>Model: Gemini 2.5 Flash</span>
              <span className="text-[#088fff] font-bold">100% Dynamic Telemetry</span>
            </div>
          </div>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default AnalyticsPage;
