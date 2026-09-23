import { ArrowUpRight } from 'lucide-react';

export const Footer = ({ onGetStarted }) => {
  return (
    <footer className="bg-[#1A1A1A] text-[#F9F8F5] pt-16 pb-12 overflow-hidden border-t border-[#1A1A1A]">
      {/* Massive Editorial Serif "budget buddy" Typography Banner */}
      <div className="w-full overflow-hidden select-none px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16 border-b border-white/10 pb-15">
        <div className="flex justify-center items-center">
          <div className="text-center relative w-full">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#088fff] font-bold block mb-2 font-mono">
              OFFICIAL SPECIMEN & RECORD • ALL RIGHTS RESERVED
            </span>
            <span
              className="text-[4rem] sm:text-[8rem] md:text-[11rem] lg:text-[14rem] font-medium tracking-tighter lowercase leading-none block font-editorial text-[#F9F8F5]/90 italic"
              style={{
                textShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              budget buddy
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-12 border-b border-white/10">
          {/* Left Column: CTA & Socials */}
          <div className="lg:col-span-5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-3 font-mono">
              NEXT STEP / ONBOARDING
            </span>
            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white  leading-tight max-w-sm mb-6">
              READY TO TAKE CONTROL OF YOUR <span className=" italic text-[#088fff]">FINANCIAL</span> FUTURE
            </h3>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={() => onGetStarted && onGetStarted('signup')}
                id="footer-get-started-btn"
                className="bg-[#F9F8F5] hover:bg-[#088fff] text-[#1A1A1A] hover:text-[#F9F8F5] text-[11px] uppercase tracking-[0.2em] font-bold px-6 py-3.5 rounded-sm transition-all duration-200 shadow-md flex items-center gap-2 group cursor-pointer"
              >
                <span>SIGN UP / GET STARTED</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onGetStarted && onGetStarted('login')}
                id="footer-signin-btn"
                className="border border-white/20 hover:border-[#088fff] hover:bg-[#088fff]/10 text-white text-[11px] uppercase tracking-[0.2em] font-bold px-5 py-3.5 rounded-sm transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span>OLD USER? SIGN IN</span>
              </button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="w-8 h-8 rounded-sm bg-white/5 hover:bg-white text-white hover:text-[#1A1A1A] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-8 h-8 rounded-sm bg-white/5 hover:bg-white text-white hover:text-[#1A1A1A] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              <a
                href="#"
                aria-label="X (Twitter)"
                className="w-8 h-8 rounded-sm bg-white/5 hover:bg-white text-white hover:text-[#1A1A1A] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-sm bg-white/5 hover:bg-white text-white hover:text-[#1A1A1A] flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.239-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
            </div>
          </div>

          {/* Right 4 Columns Navigation */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-4 font-mono">
                Platform
              </span>
              <ul className="space-y-2 text-white/80 font-sans-clean text-xs">
                <li><a href="#dashboard" className="hover:text-white hover:underline transition-colors">Dashboard Telemetry</a></li>
                <li><a href="#savings" className="hover:text-white hover:underline transition-colors">50/30/20 Rule Engine</a></li>
                <li><a href="#savings" className="hover:text-white hover:underline transition-colors">Emergency Vault</a></li>
                <li><a href="#profile" className="hover:text-white hover:underline transition-colors">Security & 2FA</a></li>
                <li><a href="#products" className="hover:text-white hover:underline transition-colors">EMI Bento Cards</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-4 font-mono">
                Company
              </span>
              <ul className="space-y-2 text-white/80 font-sans-clean text-xs">
                <li><a href="#about" className="hover:text-white hover:underline transition-colors">About Us</a></li>
                <li><a href="#testimonials" className="hover:text-white hover:underline transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Cookie Policy</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-4 font-mono">
                Resource
              </span>
              <ul className="space-y-2 text-white/80 font-sans-clean text-xs">
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Customers</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Strategic</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-colors">E-books & Guides</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Webinar</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-4 font-mono">
                Support
              </span>
              <ul className="space-y-2 text-white/80 font-sans-clean text-xs">
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Rights Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 font-sans-clean gap-4">
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Torstraße 140, 10119</span>
            <span>•</span>
            <span>hello@budgetbuddy.io</span>
          </div>

          <div className="text-right flex items-center gap-6 text-[11px]">
            <span className="text-[10px] uppercase tracking-widest font-mono opacity-50">Volume 04</span>
            <span className="italic font-editorial text-white/80">© 2026 Budget Buddy Systems Gmbh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
