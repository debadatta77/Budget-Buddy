import { useState } from 'react';
import { X, Wifi, Sparkles, RefreshCw, Copy, Shield } from 'lucide-react';

export const CardCustomizerModal = ({ isOpen, onClose, cardData, onSave }) => {
  const initialData = cardData || {
    holderName: 'Ralph Edwards',
    cardNumber: '•••• •••• •••• 4821',
    expiryDate: '12/28',
    cvv: '894',
    theme: 'black'
  };

  const [formData, setFormData] = useState(initialData);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCard = () => {
    navigator.clipboard.writeText(formData.cardNumber || '4821');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onSave(formData);
    onClose();
  };

  const themes = [
    { id: 'orange', name: 'Electric Blue', bg: 'linear-gradient(135deg, #088fff 0%, #0055c4 100%)', color: '#088fff' },
    { id: 'black', name: 'Obsidian Matte', bg: 'linear-gradient(135deg, #1C1C1F 0%, #0A0A0A 100%)', color: '#1C1C1F' },
    { id: 'silver', name: 'Titanium Ice', bg: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)', color: '#94A3B8' },
    { id: 'emerald', name: 'Emerald Vault', bg: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)', color: '#059669' },
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
          Adjust cardholder engraving, color themes, and instantly preview 3D lighting.
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
                    {formData.cardNumber}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[7px] uppercase tracking-widest text-white/70 block font-mono">Cardholder</span>
                    <span className="text-xs sm:text-sm font-mono font-bold tracking-wide">
                      {formData.holderName || 'Ralph Edwards'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[7px] uppercase tracking-widest text-white/70 block font-mono">Expires</span>
                    <span className="text-xs font-mono">{formData.expiryDate}</span>
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
                    CVV {formData.cvv}
                  </span>
                </div>
                <div className="text-[8px] text-white/60 font-mono leading-tight">
                  This card is issued by Budget Buddy Bank Ltd under license from Visa International.
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-[#1A1A1A]/70 font-mono">
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="hover:text-[#1A1A1A] flex items-center gap-1 bg-[#F9F8F5] px-3 py-1 rounded-sm border border-[#1A1A1A]/20 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isFlipped ? 'View Front' : 'Flip to Back'}</span>
            </button>
            <button
              onClick={handleCopyCard}
              className="hover:text-[#1A1A1A] flex items-center gap-1 bg-[#F9F8F5] px-3 py-1 rounded-sm border border-[#1A1A1A]/20 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy Number'}</span>
            </button>
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
                  key={t.id}
                  onClick={() => setFormData({ ...formData, theme: t.id })}
                  className={`p-3 rounded-sm border flex items-center gap-2 transition-all cursor-pointer ${
                    formData.theme === t.id
                      ? 'border-[#088fff] bg-white ring-1 ring-[#088fff]'
                      : 'border-[#1A1A1A]/15 bg-white/50 hover:bg-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ background: t.color }}
                  />
                  <span className="text-xs font-mono font-semibold text-[#1A1A1A] truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
              Name on Card (Embossed Specimen)
            </label>
            <input
              type="text"
              value={formData.holderName}
              onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
              className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-mono"
              placeholder="e.g. Ralph Edwards"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A1A1A]/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-3 rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] shadow-md transition-all font-sans-clean cursor-pointer"
          >
            Apply to Website Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardCustomizerModal;
