import { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Confirmation Modal for Delete Operations
 * Prevents accidental deletions across transactions, loans, cards, and budgets.
 */
export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName = '',
  itemDetails = '',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  dangerLevel = 'high' // 'high' (rose) | 'warning' (amber)
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRose = dangerLevel === 'high';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-[#1A1A1A] text-white border border-white/15 rounded-md p-6 max-w-sm w-full shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-sm hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Banner */}
        <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center border ${
          isRose 
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {isRose ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </div>

        {/* Title */}
        <h3 className="text-base font-editorial font-bold text-white text-center mb-1 uppercase tracking-wider">
          {title}
        </h3>

        {/* Optional Item Preview Card */}
        {itemName && (
          <div className="bg-white/5 border border-white/10 rounded-sm p-2.5 my-3 text-center">
            <span className="text-xs font-bold text-white font-mono block truncate">
              {itemName}
            </span>
            {itemDetails && (
              <span className="text-[11px] text-white/60 font-mono block mt-0.5">
                {itemDetails}
              </span>
            )}
          </div>
        )}

        {/* Warning Message */}
        <p className="text-xs text-white/70 text-center leading-relaxed font-light mb-6 px-1">
          {message}
        </p>

        {/* Action Buttons: Cancel vs Delete */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-sm bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-2.5 px-3 rounded-sm text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
              isRose
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
