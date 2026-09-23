import { useState, useEffect } from 'react';
import { X, Mail, Download, CheckCircle2, BarChart3, PieChart, Sparkles, Send, ShieldCheck, FileText } from 'lucide-react';
import { getLiveMonthlyReportData, generateReportHTMLDocument, sendTestMonthlyReportEmail } from '../../services/monthlyReportService';

export const MonthlyReportModal = ({ isOpen, onClose, userEmail = 'user@budgetbuddy.app' }) => {
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [data, setData] = useState(getLiveMonthlyReportData());

  useEffect(() => {
    if (isOpen) {
      setData(getLiveMonthlyReportData());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { summary, cashFlow, categories, aiInsights, topTransactions } = data;

  const handleSendEmailNow = async () => {
    setSending(true);
    setSentMessage('');
    try {
      const res = await sendTestMonthlyReportEmail(userEmail);
      if (res.success) {
        setSentMessage(res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDownloadDocument = () => {
    const htmlContent = generateReportHTMLDocument({ ...data, user: { ...data.user, email: userEmail } });
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BudgetBuddy_Monthly_Statement_${data.month.replace(' ', '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-[#1A1A1A]">
        {/* Top Header */}
        <div className="sticky top-0 z-10 bg-[#1A1A1A] text-white p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#088fff] flex items-center justify-center font-bold text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#088fff] font-bold block">
                USER MONTH-END AUTOMATED REPORT PREVIEW
              </span>
              <h2 className="text-xl font-editorial font-bold text-white">
                Executive Statement ({data.month})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 rounded-sm cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {sentMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-sm flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{sentMessage}</span>
            </div>
          )}

          {/* Delivery Target Badge */}
          <div className="bg-white p-4 rounded-sm border border-[#1A1A1A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#088fff]" />
              <div className="text-xs">
                <span className="text-[#1A1A1A]/60 block font-mono">AUTOMATED MONTH-END RECIPIENT:</span>
                <span className="font-bold font-mono text-sm text-[#1A1A1A]">{userEmail}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold font-mono rounded-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Month-End Schedule Active
              </span>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-sm border border-[#1A1A1A]/10 shadow-sm">
              <span className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase font-bold block">Total Monthly Income</span>
              <span className="text-xl font-bold font-editorial text-[#088fff] block mt-1">₹{summary.totalIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-4 rounded-sm border border-[#1A1A1A]/10 shadow-sm">
              <span className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase font-bold block">Total Expenses</span>
              <span className="text-xl font-bold font-editorial text-[#1A1A1A] block mt-1">₹{summary.totalExpense.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-4 rounded-sm border border-[#1A1A1A]/10 shadow-sm">
              <span className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase font-bold block">Net Savings</span>
              <span className="text-xl font-bold font-editorial text-emerald-600 block mt-1">₹{summary.netSavings.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-4 rounded-sm border border-[#1A1A1A]/10 shadow-sm">
              <span className="text-[10px] font-mono text-[#1A1A1A]/60 uppercase font-bold block">Savings Rate</span>
              <span className="text-xl font-bold font-editorial text-[#1A1A1A] block mt-1">{summary.savingsRate}%</span>
            </div>
          </div>

          {/* Cash Flow Trajectory Chart */}
          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#088fff]" />
                <h3 className="text-lg font-editorial font-bold">6-Month Cash Flow Trajectory</h3>
              </div>
              <span className="text-[10px] font-mono text-[#1A1A1A]/50">Included in Email Document</span>
            </div>

            <div className="h-48 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-[#1A1A1A]/10">
              {cashFlow.map((t, i) => {
                const maxVal = Math.max(150000, summary.totalIncome * 1.25);
                const incHeight = (t.income / maxVal) * 100;
                const expHeight = (t.expense / maxVal) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      <div style={{ height: `${incHeight}%` }} className="w-1/2 bg-[#088fff] rounded-t-sm" title={`Income: ₹${t.income}`} />
                      <div style={{ height: `${expHeight}%` }} className="w-1/2 bg-[#1A1A1A] rounded-t-sm" title={`Expense: ₹${t.expense}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/70 uppercase">{t.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 pt-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#088fff] rounded-sm"></span>
                <span>Income</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#1A1A1A] rounded-sm"></span>
                <span>Expenses</span>
              </span>
            </div>
          </div>

          {/* Grid: Categories & 50/30/20 Rule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1A1A1A]/10">
                <PieChart className="w-4 h-4 text-[#088fff]" />
                <h4 className="text-base font-editorial font-bold">Category Distribution</h4>
              </div>
              <div className="space-y-3 text-xs">
                {categories.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>{cat.name}</span>
                      <span className="font-mono font-bold">₹{cat.amount.toLocaleString('en-IN')} ({cat.percent}%)</span>
                    </div>
                    <div className="w-full bg-[#1A1A1A]/5 rounded-full h-2 overflow-hidden">
                      <div style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} className="h-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-[#1A1A1A] text-white p-6 rounded-sm shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-base font-editorial font-bold text-white">Gemini Monthly AI Audit</h4>
                </div>
                <div className="space-y-3 text-xs">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-sm">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                        {insight.title}
                      </span>
                      <p className="text-white/80 font-light leading-relaxed">{insight.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10 flex justify-between text-[10px] font-mono text-white/50">
                <span>Account: {data.user.name}</span>
                <span className="text-[#088fff] font-bold">Live Data Sync</span>
              </div>
            </div>
          </div>

          {/* Top Transactions Specimen */}
          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <h4 className="text-base font-editorial font-bold pb-3 border-b border-[#1A1A1A]/10 mb-4">
              Recorded User Transactions Ledger
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1A1A1A]/10 text-[#1A1A1A]/60 font-mono text-[10px] uppercase">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center">Date</th>
                    <th className="pb-2 text-center">Category</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]/5">
                  {(topTransactions && topTransactions.length > 0) ? (
                    topTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-[#F9F8F5]">
                        <td className="py-2.5 font-medium">{tx.title || tx.name}</td>
                        <td className="py-2.5 text-center font-mono text-[#1A1A1A]/60">{tx.date}</td>
                        <td className="py-2.5 text-center">
                          <span className="bg-[#088fff]/10 text-[#088fff] px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold">
                            {tx.category || tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold">₹{Number(tx.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-[#1A1A1A]/50 font-mono">No transaction records logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="sticky bottom-0 z-10 bg-white p-6 border-t border-[#1A1A1A]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#1A1A1A]/60 font-mono">
            Document Format: <span className="font-bold text-[#1A1A1A]">HTML & PDF Ready</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadDocument}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Document</span>
            </button>

            <button
              onClick={handleSendEmailNow}
              disabled={sending}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#088fff] hover:bg-[#0077e6] text-white font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send to Mail Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportModal;
