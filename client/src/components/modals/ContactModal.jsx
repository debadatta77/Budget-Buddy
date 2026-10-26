import { useState, useEffect, useContext } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Mail,
  User,
  Phone,
  MessageSquare,
  Tag,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { submitContactInquiry } from '../../services/contactService';

export const ContactModal = ({ isOpen, onClose, initialMode = 'inquiry' }) => {
  const { user } = useContext(AuthContext);

  const [formMode, setFormMode] = useState(initialMode); // 'inquiry' | 'complaint'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    complaintCategory: 'Transaction / Balance Discrepancy',
    severity: 'High',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Prefill user details if logged in & reset on open
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsSubmitting(false);
      setErrorMsg('');
      setTicketId('');
      setCopiedTicket(false);
      setFormMode(initialMode);
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        subject: 'General Inquiry',
        complaintCategory: 'Transaction / Balance Discrepancy',
        severity: 'High',
        message: ''
      });
    }
  }, [isOpen, user, initialMode]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMsg('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);

    const isComplaint = formMode === 'complaint';

    try {
      const result = await submitContactInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        type: isComplaint ? 'complaint' : 'inquiry',
        severity: isComplaint ? formData.severity : 'Medium',
        complaintCategory: isComplaint ? formData.complaintCategory : '',
        subject: isComplaint ? `Complaint: ${formData.complaintCategory}` : formData.subject,
        message: formData.message.trim()
      });

      setIsSubmitting(false);

      if (result.success) {
        setTicketId(result.ticketId || (isComplaint ? `CMP-${Math.floor(10000 + Math.random() * 90000)}` : ''));
        setIsSuccess(true);
      } else {
        setErrorMsg(result.message || 'Failed to send message. Please try again.');
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to send message. Please try again.');
    }
  };

  const handleCopyTicket = () => {
    if (!ticketId) return;
    navigator.clipboard.writeText(ticketId);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="bg-[#F9F8F5] border border-[#1A1A1A]/20 text-[#1A1A1A] w-full max-w-lg rounded-sm p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-sm bg-[#1A1A1A]/5 hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <div>
            {/* Header */}
            <div className="mb-4 pr-8">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-1 font-mono">
                {formMode === 'complaint' ? 'FORMAL GRIEVANCE & DISPUTE REDRESSAL' : 'SUPPORT & GENERAL INQUIRIES'}
              </span>
              <h2 className="text-2xl font-editorial font-bold text-[#1A1A1A]">
                {formMode === 'complaint' ? (
                  <>FILE A <span className="italic text-rose-600">COMPLAINT</span></>
                ) : (
                  <>GET IN <span className="italic text-[#088fff]">TOUCH</span></>
                )}
              </h2>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mb-5 flex rounded-sm bg-white p-1 border border-[#1A1A1A]/15 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setFormMode('inquiry');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-sm text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-sm text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formMode === 'complaint'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[#1A1A1A]/60 hover:text-rose-600'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                <span>File a Complaint</span>
              </button>
            </div>

            {formMode === 'complaint' && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-2 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  Disputes are tagged with a tracking Reference Ticket and escalated directly to Platform Governance.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-mono rounded-sm">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#088fff]" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff] transition-colors"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-[#088fff]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone Number */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#088fff]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff] transition-colors"
                  />
                </div>

                {/* Subject or Urgency */}
                {formMode === 'complaint' ? (
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-rose-700 block mb-1 font-mono">
                      Urgency / Severity *
                    </label>
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-sm text-xs font-semibold text-rose-800 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="Critical">🔴 Critical (Immediate Discrepancy)</option>
                      <option value="High">🟠 High (Financial Impact / Calculation)</option>
                      <option value="Medium">🟡 Medium (Operational Glitch)</option>
                      <option value="Low">🟢 Low (Minor Display / Query)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-[#088fff]" />
                      <span>Inquiry Topic</span>
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff] transition-colors cursor-pointer"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Feature Feedback">Feature Feedback</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Account Support">Account Support</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Complaint Category */}
              {formMode === 'complaint' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono">
                    Dispute / Complaint Category *
                  </label>
                  <select
                    name="complaintCategory"
                    value={formData.complaintCategory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs text-[#1A1A1A] font-medium focus:outline-none focus:border-[#088fff] cursor-pointer"
                  >
                    <option value="Transaction / Balance Discrepancy">Transaction / Balance Discrepancy</option>
                    <option value="Vault & Emergency Savings Lock Issue">Vault & Emergency Savings Lock Issue</option>
                    <option value="EMI Studio / Card Schedule Mismatch">EMI Studio / Card Schedule Mismatch</option>
                    <option value="AI Advisor Recommendation Anomaly">AI Advisor Recommendation Anomaly</option>
                    <option value="Account Access & Authentication">Account Access & Authentication</option>
                    <option value="Technical Glitch / Bug Report">Technical Glitch / Bug Report</option>
                    <option value="Other Service Grievance">Other Service Grievance</option>
                  </select>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/70 block mb-1 font-mono flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-[#088fff]" />
                  <span>{formMode === 'complaint' ? 'Complaint Description *' : 'Your Message *'}</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows="3"
                  placeholder={
                    formMode === 'complaint'
                      ? 'Describe what occurred, transaction amounts involved, or what was disrupted...'
                      : 'Tell us what you need help with or share your thoughts...'
                  }
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff] transition-colors resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-sm font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 text-white ${
                  formMode === 'complaint'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#1A1A1A] hover:bg-[#088fff]'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Submitting...'
                    : formMode === 'complaint'
                    ? 'File Formal Complaint'
                    : 'Submit Inquiry'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-emerald-600 block font-mono">
                {formMode === 'complaint' ? 'GRIEVANCE REGISTERED' : 'MESSAGE TRANSMITTED'}
              </span>
              <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A]">
                Thank You, <span className="italic text-[#088fff]">{formData.name}</span>
              </h3>

              {ticketId && (
                <div className="p-3 bg-white border border-emerald-300 rounded-sm flex items-center justify-between gap-3 text-xs font-mono max-w-sm mx-auto shadow-2xs">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                      Reference Ticket
                    </span>
                    <span className="text-sm font-bold text-emerald-950">{ticketId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedTicket ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTicket ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              <p className="text-xs text-[#1A1A1A]/70 max-w-sm mx-auto leading-relaxed">
                {formMode === 'complaint'
                  ? 'Your complaint is synced live to the Governance Console under priority status. Our support desk will reach out shortly.'
                  : `Your inquiry has been logged. Our team will review it and reply to ${formData.email} shortly.`}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold px-6 py-2 rounded-sm transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setTicketId('');
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: '',
                    subject: 'General Inquiry',
                    complaintCategory: 'Transaction / Balance Discrepancy',
                    severity: 'High',
                    message: ''
                  });
                }}
                className="border border-[#1A1A1A]/20 hover:border-[#088fff] text-[#1A1A1A] text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-sm transition-colors cursor-pointer"
              >
                Send Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
