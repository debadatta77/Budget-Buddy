import { useState, useEffect } from 'react';
import { X, Wifi, Sparkles, RefreshCw, Copy, Shield, RotateCcw } from 'lucide-react';

const EMPTY_CARD = {
  holderName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  theme: 'black'
};

export const CardCustomizerModal = ({ isOpen, onClose, cardData, onSave }) => {
  const [formData, setFormData] = useState(cardData || EMPTY_CARD);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...EMPTY_CARD, ...(cardData || {}) });
    }
  }, [isOpen, cardData]);

  if (!isOpen) return null;

  const cleanLast4 = (formData.cardNumber || '').replace(/\D/g, '').slice(-4);
  const displayCardNumber = cleanLast4 ? `•••• •••• •••• ${cleanLast4}` : '•••• •••• •••• ••••';

  const handleCopyCard = () => {
    navigator.clipboard.writeText(cleanLast4 || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFormData(EMPTY_CARD);
    if (onSave) onSave(EMPTY_CARD);
  };

  const handleApply = () => {
    if (onSave) {
      onSave({
        ...formData,
        holderName: (formData.holderName || '').trim(),
        cardNumber: cleanLast4,
        expiryDate: (formData.expiryDate || '').trim()
      });
    }
    onClose();
  };

  const themes = [
    { id: 'black', name: 'Obsidian Midnight', bg: 'linear-gradient(135deg, #090A0F 0%, #171923 50%, #0F172A 100%)', color: '#090A0F' },
    { id: 'blue', name: 'Electric Sapphire', bg: 'linear-gradient(135deg, #030712 0%, #0284C7 50%, #2563EB 100%)', color: '#0284C7' },
    { id: 'emerald', name: 'Imperial Emerald', bg: 'linear-gradient(135deg, #022C22 0%, #059669 50%, #10B981 100%)', color: '#059669' },
    { id: 'silver', name: 'Platinum Titanium', bg: 'linear-gradient(135deg, #1E293B 0%, #475569 50%, #94A3B8 100%)', color: '#64748B' },
    { id: 'purple', name: 'Cosmic Violet', bg: 'linear-gradient(135deg, #1E1B4B 0%, #6B21A8 50%, #C084FC 100%)', color: '#7E22CE' },
    { id: 'gold', name: 'Royal Champagne', bg: 'linear-gradient(135deg, #451A03 0%, #B45309 50%, #F59E0B 100%)', color: '#D97706' },
    { id: 'rose', name: 'Rose Gold Metallic', bg: 'linear-gradient(135deg, #4C0519 0%, #9F1239 50%, #FB7185 100%)', color: '#E11D48' }
  ];

  const activeThemeObj = themes.find((t) => t.id === formData.theme) || themes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#F9F8F5] border border-[#1A1A1A]/20 text-[#1A1A1A] w-full max-w-2xl rounded-sm p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-sm bg-[#1A1A1A]/5 hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#088fff] text-[10px] font-bold uppercase tracking-[0.25em] mb-2 font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Specimen Laboratory / Studio 3D</span>
        </div>

        <h3 className="text-3xl font-medium font-editorial mb-1">
          Customize Your Card Specimen
        </h3>
        <p className="text-xs text-[#1A1A1A]/70 mb-6 font-sans-clean">
          Enter your cardholder name, last 4 digits, expiry date, and metallic finish.
        </p>

        {/* 3D Card Interactive Preview Canvas */}
        <div className="flex flex-col items-center justify-center py-6 bg-white rounded-sm border border-[#1A1A1A]/15 mb-6 relative overflow-hidden">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-72 sm:w-80 h-44 sm:h-48 rounded-sm p-5 flex flex-col justify-between shadow-2xl transition-all duration-500 cursor-pointer select-none relative"
            style={{
              background: activeThemeObj.bg,
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* FRONT SIDE */}
            {!isFlipped ? (
              <div className="flex flex-col justify-between h-full text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 fill-white" />
                    <span className="text-base font-editorial font-bold tracking-widest">BUDGET BUDDY</span>
                  </div>
                  <Wifi className="w-4 h-4 rotate-90 opacity-80" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-5 rounded-[2px] bg-gradient-to-r from-amber-200 to-yellow-400 flex items-center justify-center shadow-inner">
                    <div className="w-4 h-3 border border-amber-800/40 rounded-[1px]"></div>
                  </div>
                  <span className="font-mono text-sm tracking-widest font-semibold">
                    {displayCardNumber}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[7px] uppercase tracking-widest text-white/70 block font-mono">Cardholder</span>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wide">
                      {formData.holderName.trim() || 'NOT CONFIGURED'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[7px] uppercase tracking-widest text-white/70 block font-mono">Expires</span>
                    <span className="text-xs font-mono">{formData.expiryDate.trim() || '--/--'}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* BACK SIDE */
              <div
                className="flex flex-col justify-between h-full text-white"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="w-full h-8 bg-black/80 -mx-5 -mt-1 mb-2"></div>
                <div className="bg-white/20 p-2 rounded-[2px] flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-300 text-[10px]">Authorized Signature</span>
                  <span className="font-bold bg-white text-black px-2 py-0.5 rounded-[1px]">
                    CVV {formData.cvv.trim() || '•••'}
                  </span>
                </div>
                <div className="text-[8px] text-white/60 font-mono leading-tight">
                  Virtual Specimen Card • Budget Buddy Financial Telemetry
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-[#1A1A1A]/70 font-mono">
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="hover:text-[#1A1A1A] flex items-center gap-1 bg-[#F9F8F5] px-3 py-1 rounded-sm border border-[#1A1A1A]/20 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isFlipped ? 'View Front' : 'Flip to Back'}</span>
            </button>
            {cleanLast4 && (
              <button
                type="button"
                onClick={handleCopyCard}
                className="hover:text-[#1A1A1A] flex items-center gap-1 bg-[#F9F8F5] px-3 py-1 rounded-sm border border-[#1A1A1A]/20 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy Last 4'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Customization Inputs */}
        <div className="space-y-4 mb-6">
          {/* Theme Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-2 font-mono">
              Select Finish & Colorway
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {themes.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setFormData({ ...formData, theme: t.id })}
                  className={`p-2.5 rounded-sm border flex items-center gap-2 transition-all cursor-pointer ${
                    formData.theme === t.id
                      ? 'border-[#088fff] bg-white ring-1 ring-[#088fff]'
                      : 'border-[#1A1A1A]/15 bg-white/50 hover:bg-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ background: t.color }}
                  />
                  <span className="text-[11px] font-mono font-semibold text-[#1A1A1A] truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name, Last 4, Expiry Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
                Name on Card
              </label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-mono"
                placeholder="Enter Your Name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
                Last 4 Digits
              </label>
              <input
                type="text"
                maxLength={4}
                value={cleanLast4}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-mono"
                placeholder="e.g. 4821"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-mono"
                placeholder="e.g. 08/29"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]/10">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Card</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-3 rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] shadow-md transition-all font-sans-clean cursor-pointer"
            >
              Save Card Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardCustomizerModal;

