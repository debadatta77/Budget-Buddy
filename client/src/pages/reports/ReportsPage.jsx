import { useState, useEffect } from 'react';
import { Download, FileText, Mail, Calendar, CheckCircle2, Eye, Send, Settings, Sparkles, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { MonthlyReportModal } from '../../components/modals/MonthlyReportModal';
import {
  getMonthlyReportSettings,
  saveMonthlyReportSettings,
  sendTestMonthlyReportEmail,
  generateReportHTMLDocument
} from '../../services/monthlyReportService';

export const ReportsPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(getMonthlyReportSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    const saved = getMonthlyReportSettings();
    setSettings(saved);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveMonthlyReportSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendTestEmail = async () => {
    setIsDispatching(true);
    setDispatchStatus('');
    try {
      const res = await sendTestMonthlyReportEmail(settings.email);
      if (res.success) {
        setDispatchStatus(res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDownloadDirectStatement = () => {
    const htmlContent = generateReportHTMLDocument();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BudgetBuddy_September_2026_Statement.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reports = [
    {
      title: 'September 2026 End-of-Month Executive Financial Statement',
      period: 'Sep 2026 (Full Month)',
      type: 'PDF & HTML Document Report',
      size: '2.8 MB',
      isAutomatedMail: true
    },
    { title: 'Q3 2026 Comprehensive Financial Audit', period: 'Jul 2026 - Sep 2026', type: 'PDF / Statement', size: '2.4 MB' },
    { title: 'Annual Tax Expense Deduction Summary', period: 'FY 2025 - 2026', type: 'Excel / CSV', size: '1.8 MB' },
    { title: 'Monthly Category Breakdown & EMI Telemetry', period: 'August 2026', type: 'PDF / Statement', size: '1.1 MB' },
    { title: '50/30/20 Rule Compliance Statement', period: 'Year-to-Date 2026', type: 'PDF / Statement', size: '890 KB' }
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              OFFICIAL STATEMENTS & AUTOMATED DISPATCH ENGINE
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              FINANCIAL <span className="italic text-[#088fff]">REPORTS</span>
            </h1>
          </div>

          <button
            onClick={() => setIsMonthlyModalOpen(true)}
            className="bg-[#088fff] hover:bg-[#0077e6] text-white px-5 py-3 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-md cursor-pointer self-start md:self-auto"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Month-End Document</span>
          </button>
        </div>

        {/* Month-End Email Dispatch Controls */}
        <div className="bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 rounded-sm shadow-lg mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#1A1A1A]/10 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-[#1A1A1A] text-[#088fff] flex items-center justify-center font-bold">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-editorial font-bold text-[#1A1A1A]">Automated Month-End Email Document Subscription</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#1A1A1A]/60 font-sans mt-0.5">
                  Receive a full financial chart, category telemetries, and AI audit in document format directly in your email inbox at every month-end.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMonthlyModalOpen(true)}
                className="px-4 py-2.5 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>View Full Document</span>
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isDispatching}
                className="px-4 py-2.5 bg-[#088fff] hover:bg-[#0077e6] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? 'Dispatching...' : 'Send Test Mail Now'}</span>
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Monthly Email Dispatch preferences saved successfully!</span>
            </div>
          )}

          {dispatchStatus && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-sm flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#088fff]" />
              <span>{dispatchStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-[#1A1A1A]/70 mb-2">
                  Target Recipient Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm text-sm focus:outline-none focus:border-[#088fff] font-mono"
                  placeholder="yourname@domain.com"
                  required
                />
              </div>

              {/* Schedule Frequency */}
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-[#1A1A1A]/70 mb-2">
                  Delivery Schedule Frequency
                </label>
                <select
                  value={settings.schedule}
                  onChange={(e) => setSettings({ ...settings, schedule: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm text-sm focus:outline-none focus:border-[#088fff]"
                >
                  <option value="MONTH_END">Every Month End (Last Day 11:59 PM)</option>
                  <option value="FIRST_OF_MONTH">1st of Every Month (8:00 AM)</option>
                  <option value="BI_WEEKLY">Bi-Weekly Financial Telemetry Update</option>
                </select>
              </div>

              {/* Document Format */}
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-[#1A1A1A]/70 mb-2">
                  Document Format Option
                </label>
                <select
                  value={settings.format}
                  onChange={(e) => setSettings({ ...settings, format: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm text-sm focus:outline-none focus:border-[#088fff]"
                >
                  <option value="PDF_AND_HTML">Interactive HTML & PDF Statement Document</option>
                  <option value="PDF_ONLY">PDF Attachment Only</option>
                  <option value="HTML_ONLY">Inline Email HTML Document</option>
                  <option value="CSV">CSV Data File</option>
                </select>
              </div>
            </div>

            {/* Included Sections Checkboxes */}
            <div className="pt-4 border-t border-[#1A1A1A]/10">
              <span className="block text-xs font-bold font-mono uppercase text-[#1A1A1A]/70 mb-3">
                Include in Monthly Email Document:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.cashFlowCharts}
                    onChange={(e) => setSettings({
                      ...settings,
                      sections: { ...settings.sections, cashFlowCharts: e.target.checked }
                    })}
                    className="accent-[#088fff] w-4 h-4"
                  />
                  <span>Income & Expense Trajectory Bar Chart</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.categoryBreakdown}
                    onChange={(e) => setSettings({
                      ...settings,
                      sections: { ...settings.sections, categoryBreakdown: e.target.checked }
                    })}
                    className="accent-[#088fff] w-4 h-4"
                  />
                  <span>Category Expense Distribution</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.rule503020}
                    onChange={(e) => setSettings({
                      ...settings,
                      sections: { ...settings.sections, rule503020: e.target.checked }
                    })}
                    className="accent-[#088fff] w-4 h-4"
                  />
                  <span>50/30/20 Telemetry Breakdown</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.aiAdvisorInsights}
                    onChange={(e) => setSettings({
                      ...settings,
                      sections: { ...settings.sections, aiAdvisorInsights: e.target.checked }
                    })}
                    className="accent-[#088fff] w-4 h-4"
                  />
                  <span>Gemini AI Savings Insights</span>
                </label>
              </div>
            </div>

            {/* Submit & Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1A1A1A]/10">
              <div className="flex items-center gap-2 text-xs font-mono text-[#1A1A1A]/60">
                <Calendar className="w-4 h-4 text-[#088fff]" />
                <span>Next Scheduled Dispatch: <strong className="text-[#1A1A1A]">{settings.nextScheduled}</strong></span>
              </div>

              <button
                type="submit"
                className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-6 rounded-sm transition-colors cursor-pointer w-full sm:w-auto"
              >
                Save Subscription Settings
              </button>
            </div>
          </form>
        </div>

        {/* Downloadable Reports Section */}
        <h2 className="text-2xl font-editorial font-bold mb-6 text-[#1A1A1A]">Official Statement Archives</h2>

        <div className="space-y-4">
          {reports.map((r, i) => (
            <div key={i} className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#1A1A1A]/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.isAutomatedMail ? 'bg-[#088fff]/10 text-[#088fff]' : 'bg-[#1A1A1A]/5 text-[#1A1A1A]'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-editorial text-[#1A1A1A]">{r.title}</h3>
                    {r.isAutomatedMail && (
                      <span className="bg-[#088fff]/15 text-[#088fff] text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm">
                        MONTH-END EMAIL ATTACHMENT
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#1A1A1A]/60 font-mono block mt-1">
                    Period: {r.period} • {r.type} • {r.size}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {r.isAutomatedMail ? (
                  <>
                    <button
                      onClick={() => setIsMonthlyModalOpen(true)}
                      className="border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs uppercase tracking-widest font-bold py-2.5 px-4 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={handleDownloadDirectStatement}
                      className="bg-[#088fff] hover:bg-[#0077e6] text-white text-xs uppercase tracking-widest font-bold py-2.5 px-4 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => alert(`Downloading ${r.title}...`)}
                    className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-5 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
      <MonthlyReportModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
        userEmail={settings.email}
      />
    </div>
  );
};

export default ReportsPage;
