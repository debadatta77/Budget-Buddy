import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';

export const ContactPage = () => {
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setSubmitted(false);
      alert('Thank you for contacting Budget-Buddy support. We will get back to you within 24 hours!');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              24/7 SUPPORT & INQUIRIES
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              CONTACT <span className="italic text-[#088fff]">BUDGET BUDDY</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#088fff]/10 flex items-center justify-center text-[#088fff]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/50 block">Direct Email</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">support@budgetbuddy.com</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#1A1A1A]/10">
                <div className="w-10 h-10 rounded-full bg-[#088fff]/10 flex items-center justify-center text-[#088fff]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/50 block font-mono">24/7 Toll-Free Support</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">1800-482-BUDGET (283438)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#1A1A1A]/10">
                <div className="w-10 h-10 rounded-full bg-[#088fff]/10 flex items-center justify-center text-[#088fff]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/50 block font-mono">Headquarters</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">Financial Center Tower, Mumbai, MH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-sm border border-[#1A1A1A]/15 shadow-xl">
            <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-6">Send Us a Direct Message</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Card Customization Query, Feature Request"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitted}
                className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-white py-3.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitted ? 'Sending Message...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default ContactPage;
