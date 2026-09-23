import { X, Sparkles } from 'lucide-react';
import GeminiAdvisorChat from '../ai/GeminiAdvisorChat';

export const AiAdvisorModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] text-white w-full max-w-xl rounded-sm shadow-2xl border border-white/10 relative overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#088fff]/20 border border-[#088fff]/40 flex items-center justify-center text-[#088fff]">
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-editorial uppercase tracking-wider text-white">
                Budget Buddy / AI Financial Advisor
              </h3>
              <span className="text-[9px] text-white/50 font-mono block">
                INTELLIGENT FINANCIAL GUIDANCE & SUGGESTIONS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-sm transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded Gemini Chat */}
        <div className="p-4 flex-1">
          <GeminiAdvisorChat />
        </div>
      </div>
    </div>
  );
};

export default AiAdvisorModal;
