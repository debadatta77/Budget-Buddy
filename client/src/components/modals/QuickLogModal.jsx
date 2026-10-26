import { useState, useEffect } from 'react';
import { Plus, X, ArrowDownRight, ArrowUpRight, Zap, Check } from 'lucide-react';
import { addUserTransaction } from '../../services/userDataService';
import { useCurrency } from '../../utils/formatCurrency';

export const QuickLogModal = ({ isOpen, onClose, onSuccess }) => {
    const { symbol } = useCurrency();
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Food');
    const [justLogged, setJustLogged] = useState(false);

    // Reset fields on modal open
    useEffect(() => {
        if (isOpen) {
            setType('expense');
            setAmount('');
            setTitle('');
            setCategory('Food');
            setJustLogged(false);
        }
    }, [isOpen]);

    // Handle ESC key dismiss
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return;

        const newTx = {
            id: Date.now().toString(),
            title: title.trim() || (type === 'income' ? 'Quick Inflow' : 'Quick Expense'),
            amount: numericAmount,
            type,
            category: type === 'income' ? 'Income' : category,
            date: new Date().toISOString().split('T')[0]
        };

        addUserTransaction(newTx);
        setJustLogged(true);

        if (onSuccess) {
            onSuccess(newTx);
        }

        setTimeout(() => {
            onClose();
        }, 350);
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-[#1A1A1A] text-white border border-white/20 rounded-md p-6 max-w-md w-full shadow-2xl relative">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#088fff]/20 text-[#088fff] flex items-center justify-center font-bold">
                            <Zap className="w-3.5 h-3.5 fill-[#088fff]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-editorial font-bold text-white uppercase tracking-wider">
                                Instant Quick Log
                            </h3>
                            <span className="text-[10px] font-mono text-white/50 block">
                                Fast-entry ledger protocol • Auto-synced
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Type Buttons */}
                    <div>
                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1.5 font-bold">
                            Transaction Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setType('expense');
                                    if (category === 'Income') setCategory('Food');
                                }}
                                className={`py-2 text-xs font-mono font-bold rounded-sm border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                    type === 'expense'
                                        ? 'bg-rose-600/90 text-white border-rose-500 shadow-sm'
                                        : 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10'
                                }`}
                            >
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                <span>Expense (-)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setType('income');
                                    setCategory('Income');
                                }}
                                className={`py-2 text-xs font-mono font-bold rounded-sm border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                    type === 'income'
                                        ? 'bg-emerald-600/90 text-white border-emerald-500 shadow-sm'
                                        : 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10'
                                }`}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Income (+)</span>
                            </button>
                        </div>
                    </div>

                    {/* Hero Amount Input - Primary visual focal point */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[10px] uppercase font-mono font-bold text-white/70">
                                Amount ({symbol})
                            </label>
                            <span className={`text-[10px] font-mono font-bold ${
                                type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {type === 'income' ? '+ Inflow' : '- Outflow'}
                            </span>
                        </div>
                        <div className={`relative flex items-center bg-[#111111] border rounded-sm p-1.5 transition-all ${
                            type === 'income'
                                ? 'border-emerald-500/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20'
                                : 'border-rose-500/50 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/20'
                        }`}>
                            <span className={`pl-2.5 pr-1.5 text-2xl font-mono font-bold select-none ${
                                type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                                {symbol}
                            </span>
                            <input
                                type="number"
                                step="any"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-transparent text-2xl font-mono font-bold text-white py-1 pr-2 focus:outline-none placeholder:text-white/20"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1.5 font-bold">
                            Description / Payee (Where or What)
                        </label>
                        <input
                            type="text"
                            placeholder={type === 'income' ? "e.g. Salary, Client Payout, Dividend" : "e.g. Chai, Groceries, Auto Fare, Swiggy"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff] placeholder:text-white/30"
                            required
                        />
                        {/* Smart Helper if user typed digits in the title */}
                        {/^\d+$/.test(title.trim()) && (
                            <div className="flex items-center justify-between mt-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-mono text-amber-300 animate-fadeIn">
                                <span>💡 "{title.trim()}" looks like an amount. Want to move it?</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAmount(title.trim());
                                        setTitle('');
                                    }}
                                    className="ml-2 px-2 py-0.5 bg-amber-500 text-black font-bold text-[10px] rounded hover:bg-amber-400 cursor-pointer shrink-0"
                                >
                                    Move to Amount
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Category Selector (Hidden or locked if Income) */}
                    {type === 'expense' && (
                        <div>
                            <label className="text-[10px] uppercase font-mono text-white/60 block mb-1.5 font-bold">
                                Spending Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#2A2A2A] border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff] cursor-pointer"
                            >
                                <option value="Food">Food & Dining</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Travel">Travel & Fuel</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Utilities">Utilities & Bills</option>
                                <option value="Housing">Housing & Rent</option>
                                <option value="Subscription">Subscriptions</option>
                                <option value="EMI & Loans">EMI & Loans</option>
                                <option value="Health">Health & Medical</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Education">Education</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center gap-2 pt-2 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-sm cursor-pointer transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={justLogged}
                            className={`px-5 py-2 text-xs font-bold text-white rounded-sm cursor-pointer transition-all flex items-center gap-1.5 ${
                                justLogged 
                                    ? 'bg-emerald-600' 
                                    : 'bg-[#088fff] hover:bg-[#088fff]/85 shadow-sm'
                            }`}
                        >
                            {justLogged ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Logged!</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-3.5 h-3.5 fill-white" />
                                    <span>Post Quick Entry</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickLogModal;
