import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, Send, CheckCircle2, AlertTriangle, ShieldAlert, Copy, Check, FileText } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { submitContactInquiry } from '../../services/contactService';

export const ContactPage = () => {
  const location = useLocation();
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState('');
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Mode: 'inquiry' | 'complaint'
  const [formMode, setFormMode] = useState('inquiry');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('Transaction / Balance Discrepancy');
  const [severity, setSeverity] = useState('High');
  const [message, setMessage] = useState('');

  // Check URL query param e.g. /contact?type=complaint
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'complaint') {
      setFormMode('complaint');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    setSuccess(false);

    const isComplaint = formMode === 'complaint';

    try {
      const result = await submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        type: isComplaint ? 'complaint' : 'inquiry',
        severity: isComplaint ? severity : 'Medium',
        complaintCategory: isComplaint ? complaintCategory : '',
        subject: isComplaint ? `Complaint: ${complaintCategory}` : (subject.trim() || 'General Inquiry'),
        message: message.trim()
      });

      if (result.success) {
        setGeneratedTicket(result.ticketId || (isComplaint ? `CMP-${Math.floor(10000 + Math.random() * 90000)}` : ''));
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
        setSubmitted(false);
        setSuccess(true);
      } else {
        setSubmitted(false);
        alert(result.message || 'Unable to transmit inquiry right now. Please try again.');
      }
    } catch {
      setSubmitted(false);
      alert('Unable to transmit message right now. Please try again.');
    }
  };

  const handleCopyTicket = () => {
    if (!generatedTicket) return;
    navigator.clipboard.writeText(generatedTicket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="max-w-2xl mx-auto text-center pb-8 border-b border-[#1A1A1A]/10 mb-10">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
            {formMode === 'complaint' ? 'EXECUTIVE GRIEVANCE & DISPUTE REDRESSAL' : 'DIRECT INQUIRIES & SUPPORT'}
          </span>
          <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
            {formMode === 'complaint' ? (
              <>FILE A <span className="italic text-rose-600">COMPLAINT</span></>
            ) : (
              <>CONTACT <span className="italic text-[#088fff]">BUDGET BUDDY</span></>
            )}
          </h1>
          <p className="text-xs text-[#1A1A1A]/60 font-sans-clean mt-3 max-w-md mx-auto">
            {formMode === 'complaint'
              ? 'Encountered a balance discrepancy, transaction bug, or service anomaly? File a priority complaint tracked directly in our governance response ledger.'
              : 'Have questions, feedback, or need platform assistance? Send us a message and our support team will get in touch with you.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="max-w-2xl mx-auto mb-8 flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-sm bg-white border border-[#1A1A1A]/15 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setFormMode('inquiry');
                setSuccess(false);
              }}
              className={`px-5 py-2 rounded-sm text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                formMode === 'inquiry'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#088fff]" />
              <span>General Inquiry</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode('complaint');
                setSuccess(false);
              }}
              className={`px-5 py-2 rounded-sm text-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                formMode === 'complaint'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[#1A1A1A]/60 hover:text-rose-600'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
              <span>File a Complaint</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse ml-0.5" />
            </button>
          </div>
        </div>

        {/* Contact / Complaint Form Card */}
        <div className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-sm border border-[#1A1A1A]/15 shadow-xl relative">
          {formMode === 'complaint' && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/80 rounded-sm flex items-start gap-3 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-mono uppercase tracking-wider block mb-0.5">Formal Grievance Escalation</span>
                Complaints are tagged with a priority Reference ID and dispatched directly to the Executive Admin Console & compliance sheet.
              </div>
            </div>
          )}

          <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-6">
            {formMode === 'complaint' ? 'Submit Formal Grievance' : 'Send Us a Direct Message'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Debadatta Parida"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                />
              </div>

              {formMode === 'complaint' ? (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-rose-700 block mb-1 font-mono">
                    Urgency / Severity Level *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-sm text-xs font-semibold text-rose-800 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Critical">🔴 Critical (Immediate Discrepancy)</option>
                    <option value="High">🟠 High (Financial Impact / Calculation Error)</option>
                    <option value="Medium">🟡 Medium (Operational Glitch / Sync Issue)</option>
                    <option value="Low">🟢 Low (Minor Display / Layout Query)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">
                    Inquiry Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Feature Suggestion, General Inquiry"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>
              )}
            </div>

            {formMode === 'complaint' && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono">
                  Dispute & Complaint Category *
                </label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#088fff] cursor-pointer"
                >
                  <option value="Transaction / Balance Discrepancy">Transaction / Balance Discrepancy</option>
                  <option value="Vault & Emergency Savings Lock Issue">Vault & Emergency Savings Lock Issue</option>
                  <option value="EMI Studio / Card Schedule Mismatch">EMI Studio / Card Schedule Mismatch</option>
                  <option value="AI Advisor Recommendation Anomaly">AI Advisor Recommendation Anomaly</option>
                  <option value="Account Access & Authentication">Account Access & Authentication</option>
                  <option value="Data Privacy & Security Dispute">Data Privacy & Security Dispute</option>
                  <option value="Technical Glitch / Bug Report">Technical Glitch / Bug Report</option>
                  <option value="Other Service Grievance">Other Service Grievance</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">
                {formMode === 'complaint' ? 'Complaint Description & What Happened *' : 'Message *'}
              </label>
              <textarea
                rows="4"
                required
                placeholder={
                  formMode === 'complaint'
                    ? 'Please detail the exact issue, transaction title or amount involved, and what expected outcome was disrupted...'
                    : 'Type your message or inquiry here...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
              ></textarea>
            </div>

            {/* Success Alert Banner with Reference Ticket */}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {formMode === 'complaint'
                      ? 'Grievance Registered with Executive Governance Desk!'
                      : 'Inquiry Successfully Transmitted!'}
                  </span>
                </div>

                {generatedTicket && (
                  <div className="p-3 bg-white border border-emerald-200 rounded-sm flex items-center justify-between gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-emerald-700 font-bold block">
                        COMPLAINT REFERENCE TICKET
                      </span>
                      <span className="text-sm font-bold text-emerald-900">{generatedTicket}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedTicket ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTicket ? 'Copied' : 'Copy Ticket'}</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-emerald-800">
                  {formMode === 'complaint'
                    ? 'Your complaint is synced live to the Admin response spreadsheet and will be reviewed under high priority. Please save your reference ticket.'
                    : 'Message delivered directly to our support team and Google Sheet ledger. We will respond shortly.'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitted}
              className={`w-full py-3.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                formMode === 'complaint'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#1A1A1A] hover:bg-[#088fff] text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {submitted
                  ? 'Logging Entry...'
                  : formMode === 'complaint'
                  ? 'File Formal Complaint'
                  : 'Submit Inquiry'}
              </span>
            </button>
          </form>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default ContactPage;
