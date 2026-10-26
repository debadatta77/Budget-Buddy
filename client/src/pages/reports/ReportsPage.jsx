import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, Mail, Calendar, CheckCircle2, Eye, Send, Settings, Sparkles, ShieldCheck, FileSpreadsheet, Loader2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { MonthlyReportModal } from '../../components/modals/MonthlyReportModal';
import {
  getMonthlyReportSettings,
  saveMonthlyReportSettings,
  sendTestMonthlyReportEmail,
  generateReportHTMLDocument,
  getLiveMonthlyReportData,
  exportTransactionsToCSV,
  getNextScheduledDate
} from '../../services/monthlyReportService';
import { getUserTransactions, syncAllFromBackend } from '../../services/userDataService';

export const ReportsPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [previewMonthKey, setPreviewMonthKey] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Live Transactions State
  const [transactions, setTransactions] = useState(() => getUserTransactions());

  // Settings State
  const [settings, setSettings] = useState(getMonthlyReportSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  useEffect(() => {
    syncAllFromBackend();
    const saved = getMonthlyReportSettings();
    setSettings(saved);

    const handleSync = () => {
      setTransactions(getUserTransactions());
    };
    window.addEventListener('userDataChanged', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('userDataChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
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
    setPreviewUrl(null);
    try {
      saveMonthlyReportSettings(settings);
      const res = await sendTestMonthlyReportEmail(settings.email);
      if (res.success) {
        setDispatchStatus(res.message);
        if (res.previewUrl) {
          setPreviewUrl(res.previewUrl);
        }
      } else {
        setDispatchStatus(res.message || 'Email dispatch failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setDispatchStatus('Failed to dispatch email. Please check server logs.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDownloadDirectStatement = (monthKey = null) => {
    const reportData = getLiveMonthlyReportData(monthKey);
    const htmlContent = generateReportHTMLDocument(reportData, settings.sections);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeMonth = reportData.month.replace(/\s+/g, '_');
    a.download = `BudgetBuddy_${safeMonth}_Statement.html`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const res = exportTransactionsToCSV();
    if (res.success) {
      setCsvExportSuccess(true);
      setTimeout(() => setCsvExportSuccess(false), 3500);
    }
  };

  // Dynamically compute statements from user's actual transactions
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const monthlyStatements = useMemo(() => {
    const monthKeysSet = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const ym = String(t.date).slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          monthKeysSet.add(ym);
        }
      }
    });
    // Ensure current month is always available
    monthKeysSet.add(currentMonthKey);

    return Array.from(monthKeysSet)
      .sort()
      .reverse()
      .map(key => {
        const isCurrent = key === currentMonthKey;
        const dateObj = new Date(`${key}-01`);
        const label = isCurrent 
          ? currentMonthName 
          : dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        return {
          key,
          isCurrent,
          title: isCurrent 
            ? `${label} Executive Financial Statement` 
            : `${label} Financial Statement Archive`,
          period: isCurrent 
            ? `${label} • Active Monthly Billing Cycle` 
            : `${label} (Full Month) • Closed Ledger Archive`,
          type: 'Interactive HTML & PDF Printable Report',
          badge: isCurrent ? 'CURRENT MONTH-END DISPATCH' : 'ARCHIVED STATEMENT'
        };
      });
  }, [transactions, currentMonthKey, currentMonthName]);

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
            onClick={() => {
              setPreviewMonthKey(currentMonthKey);
              setIsMonthlyModalOpen(true);
            }}
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
                  Receive a full financial chart, category spending breakdown, and AI insights in document format directly in your email inbox.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => {
                  setPreviewMonthKey(currentMonthKey);
                  setIsMonthlyModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#F9F8F5] border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 rounded-sm transition-all shadow-2xs whitespace-nowrap cursor-pointer active:scale-[0.98]"
              >
                <Eye className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                <span>View Full Document</span>
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isDispatching}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#088fff] hover:bg-[#0077e6] text-white text-xs font-semibold rounded-sm transition-all shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Mail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Get Mail Now</span>
                  </>
                )}
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
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#088fff] shrink-0" />
                <span>{dispatchStatus}</span>
              </div>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#088fff] hover:bg-[#0077e6] text-white rounded-xs font-mono text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Delivered Email ↗</span>
                </a>
              )}
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
                  onChange={(e) => {
                    const newSchedule = e.target.value;
                    setSettings({
                      ...settings,
                      schedule: newSchedule,
                      nextScheduled: getNextScheduledDate(newSchedule)
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm text-sm focus:outline-none focus:border-[#088fff]"
                >
                  <option value="MONTH_END">Every Month End (Last Day 11:59 PM)</option>
                  <option value="FIRST_OF_MONTH">1st of Every Month (8:00 AM)</option>
                  <option value="BI_WEEKLY">Bi-Weekly Financial Summary (1st & 15th)</option>
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
                  <span>50/30/20 Budget Breakdown</span>
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

        {/* Downloadable Reports & Exports Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-2xl font-editorial font-bold text-[#1A1A1A]">Official Statement Archives & Data Exports</h2>
            <p className="text-xs text-[#1A1A1A]/60 font-sans mt-0.5">
              Verified monthly executive statements and raw ledger data exports generated from your live financial records.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#1A1A1A] text-white px-2.5 py-1 rounded-xs font-bold self-start sm:self-auto">
            {monthlyStatements.length} {monthlyStatements.length === 1 ? 'Statement Archive' : 'Statement Archives'} • Verified Records
          </span>
        </div>

        {csvExportSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm flex items-center gap-2 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Transaction Ledger exported successfully as CSV! File saved to your downloads.</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Real Dynamic Monthly Statements */}
          {monthlyStatements.map((stmt) => (
            <div key={stmt.key} className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#1A1A1A]/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stmt.isCurrent ? 'bg-[#088fff]/10 text-[#088fff]' : 'bg-[#1A1A1A]/5 text-[#1A1A1A]'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold font-editorial text-[#1A1A1A]">{stmt.title}</h3>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${stmt.isCurrent ? 'bg-[#088fff]/15 text-[#088fff]' : 'bg-gray-100 text-gray-700'}`}>
                      {stmt.badge}
                    </span>
                  </div>
                  <span className="text-xs text-[#1A1A1A]/60 font-mono block mt-1">
                    Period: {stmt.period} • {stmt.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setPreviewMonthKey(stmt.key);
                    setIsMonthlyModalOpen(true);
                  }}
                  className="border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs uppercase tracking-widest font-bold py-2.5 px-4 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                  title="Preview Statement in browser"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleDownloadDirectStatement(stmt.key)}
                  className="bg-[#088fff] hover:bg-[#0077e6] text-white text-xs uppercase tracking-widest font-bold py-2.5 px-4 rounded-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  title="Download HTML Document Report"
                >
                  <Download className="w-4 h-4" />
                  <span>Download HTML</span>
                </button>
              </div>
            </div>
          ))}

          {/* Real Full Transaction Ledger CSV Export */}
          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#1A1A1A]/40 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold font-editorial text-[#1A1A1A]">Complete Transaction Ledger (CSV / Excel Export)</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm">
                    RAW DATA EXPORT
                  </span>
                </div>
                <span className="text-xs text-[#1A1A1A]/60 font-mono block mt-1">
                  Period: All Recorded Time • {transactions.length} Transactions Logged • Compatible with Excel, Google Sheets & Tax Filing
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCsv}
                className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-2.5 px-5 rounded-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                title="Download CSV spreadsheet of all transactions"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
      <MonthlyReportModal
        isOpen={isMonthlyModalOpen}
        onClose={() => {
          setIsMonthlyModalOpen(false);
          setPreviewMonthKey(null);
        }}
        userEmail={settings.email}
        selectedMonthKey={previewMonthKey}
        sections={settings.sections}
      />
    </div>
  );
};

export default ReportsPage;
