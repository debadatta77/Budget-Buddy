import { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, ShieldCheck, Target, Plus, Sliders, CheckCircle2, RotateCcw, Edit3, Trash2, Save, X } from 'lucide-react';
import { 
    getUserBudget, 
    saveUserBudget, 
    getUserVault,
    saveUserVault,
    calculateFinancialTelemetry 
} from '../../services/userDataService';

export const BudgetSavingsSection = () => {
    // Dynamic Telemetry & User Data State
    const [telemetry, setTelemetry] = useState(calculateFinancialTelemetry());
    const [budget, setBudget] = useState(getUserBudget());
    const [vault, setVault] = useState(getUserVault());

    // Vault Edit State
    const [isEditingVault, setIsEditingVault] = useState(false);
    const [editVaultCurrent, setEditVaultCurrent] = useState(vault.current);
    const [editVaultTarget, setEditVaultTarget] = useState(vault.target);

    // Custom Deposit Modal / Input State
    const [customDeposit, setCustomDeposit] = useState('');

    // Category Cap Form State
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatLimit, setNewCatLimit] = useState('');

    useEffect(() => {
        const handleSync = () => {
            setTelemetry(calculateFinancialTelemetry());
            setBudget(getUserBudget());
            setVault(getUserVault());
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, []);

    const handleIncomeChange = (newVal) => {
        const updated = { ...budget, monthlyIncome: Number(newVal) };
        saveUserBudget(updated);
        setBudget(updated);
    };

    const handleSaveVault = (e) => {
        e.preventDefault();
        const updated = {
            current: Number(editVaultCurrent),
            target: Number(editVaultTarget)
        };
        saveUserVault(updated);
        setVault(updated);
        setIsEditingVault(false);
    };

    const handleQuickDeposit = (amount) => {
        const updated = {
            ...vault,
            current: Number(vault.current || 0) + Number(amount)
        };
        saveUserVault(updated);
        setVault(updated);
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (!newCatName.trim() || !newCatLimit || isNaN(newCatLimit)) return;

        const limitVal = Number(newCatLimit);
        const newCat = {
            id: Date.now(),
            name: newCatName.trim(),
            allocated: limitVal,
            color: '#088fff'
        };

        const updatedCategories = [...(budget.categories || []), newCat];
        const updatedBudget = { ...budget, categories: updatedCategories };
        saveUserBudget(updatedBudget);
        setBudget(updatedBudget);

        setNewCatName('');
        setNewCatLimit('');
        setShowCategoryForm(false);
    };

    const handleDeleteCategory = (idxToDelete) => {
        const updatedCategories = (budget.categories || []).filter((_, idx) => idx !== idxToDelete);
        const updatedBudget = { ...budget, categories: updatedCategories };
        saveUserBudget(updatedBudget);
        setBudget(updatedBudget);
    };

    // Calculations based on user inputs
    const activeIncome = budget.monthlyIncome > 0 ? budget.monthlyIncome : (telemetry.summary.totalIncome || 100000);
    const needsAmount = Math.round(activeIncome * 0.5);
    const wantsAmount = Math.round(activeIncome * 0.3);
    const savingsAmount = Math.round(activeIncome * 0.2);

    const savedAmount = Number(vault.current || 0);
    const targetSavingsGoal = Number(vault.target || 200000);
    const goalProgressPercent = targetSavingsGoal > 0 ? Math.min(100, Math.round((savedAmount / targetSavingsGoal) * 100)) : 0;

    return (
        <section id="savings" className="bg-[#F9F8F5] text-[#1A1A1A] py-20 lg:py-28 border-b border-[#1A1A1A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 pb-8 border-b border-[#1A1A1A]/10">
                    <div className="lg:col-span-7">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-3 font-mono">
                            USER WEALTH & BUDGET ENGINE
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
                            MANAGE YOUR <br />
                            <span className="italic text-[#088fff]">WEALTH</span> ALLOCATION
                        </h2>
                    </div>

                    <div className="lg:col-span-5">
                        <p className="text-base sm:text-lg text-[#1A1A1A]/80 font-light leading-relaxed font-sans-clean">
                            Manually set your monthly net income target, manage your emergency savings reserve vault, and configure category spend limits.
                        </p>
                    </div>
                </div>

                {/* Main Bento Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Bento Card 1: 50/30/20 Rule Dynamic Allocator */}
                    <div className="lg:col-span-4 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between h-full min-h-[480px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        50 / 30 / 20 Rule Engine
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-[#088fff] bg-[#088fff]/10 px-2 py-0.5 rounded">
                                    MANUAL ENGINE
                                </span>
                            </div>

                            {/* Monthly Income Input */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-wider block mb-2">
                                    Monthly Net Income Target (₹)
                                </label>
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="number"
                                        value={activeIncome}
                                        onChange={(e) => handleIncomeChange(e.target.value)}
                                        className="w-full text-xl font-editorial font-bold text-[#1A1A1A] font-mono p-2 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                        placeholder="Enter monthly income"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="10000"
                                    max="500000"
                                    step="5000"
                                    value={activeIncome}
                                    onChange={(e) => handleIncomeChange(e.target.value)}
                                    className="w-full h-2 bg-[#1A1A1A]/10 rounded-lg appearance-none cursor-pointer accent-[#088fff]"
                                />
                                <div className="flex justify-between text-[10px] text-[#1A1A1A]/40 font-mono mt-1">
                                    <span>₹10k</span>
                                    <span>₹250k</span>
                                    <span>₹500k</span>
                                </div>
                            </div>

                            {/* 3-Tier Allocation Breakdown */}
                            <div className="space-y-4 pt-2">
                                {/* Needs 50% */}
                                <div className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                            50% Needs <span className="text-[10px] font-mono text-[#1A1A1A]/50">(Rent, Groceries, Utilities)</span>
                                        </span>
                                        <span className="text-sm font-bold text-[#1A1A1A] font-mono">
                                            ₹{needsAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#1A1A1A]" style={{ width: '50%' }}></div>
                                    </div>
                                </div>

                                {/* Wants 30% */}
                                <div className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                            30% Wants <span className="text-[10px] font-mono text-[#1A1A1A]/50">(Dining, Travel, Shopping)</span>
                                        </span>
                                        <span className="text-sm font-bold text-[#088fff] font-mono">
                                            ₹{wantsAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#088fff]" style={{ width: '30%' }}></div>
                                    </div>
                                </div>

                                {/* Savings 20% */}
                                <div className="p-3 bg-[#F9F8F5] border border-[#088fff]/20 rounded-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean flex items-center gap-1">
                                            <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                                            20% Savings & SIP Investments
                                        </span>
                                        <span className="text-sm font-bold text-emerald-700 font-mono">
                                            ₹{savingsAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600" style={{ width: '20%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[10px] uppercase font-mono text-[#1A1A1A]/50">
                            <span>Recommended SIP: ₹{savingsAmount.toLocaleString('en-IN')}/mo</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>

                    {/* Bento Card 2: Emergency Savings Reserve Vault */}
                    <div className="lg:col-span-4 bg-[#1A1A1A] text-[#F9F8F5] rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A] flex flex-col justify-between h-full min-h-[480px] relative overflow-hidden">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-white/60">
                                        Emergency Reserve Vault
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditVaultCurrent(savedAmount);
                                        setEditVaultTarget(targetSavingsGoal);
                                        setIsEditingVault(!isEditingVault);
                                    }}
                                    className="text-[10px] font-mono text-[#088fff] font-bold hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{isEditingVault ? 'Cancel' : 'Edit Vault'}</span>
                                </button>
                            </div>

                            {!isEditingVault ? (
                                <>
                                    <div className="my-2">
                                        <span className="text-[10px] uppercase tracking-widest text-white/50 block font-mono">
                                            Current Saved / Target Reserve
                                        </span>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-4xl sm:text-5xl font-bold font-editorial text-white leading-none">
                                                ₹{savedAmount.toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-sm font-mono text-white/60">
                                                / ₹{targetSavingsGoal.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Gauge */}
                                    <div className="my-6">
                                        <div className="flex justify-between items-center text-xs font-mono text-gray-300 mb-2">
                                            <span>Goal Fulfillment</span>
                                            <span className="text-[#088fff] font-bold">{goalProgressPercent}% Completed</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#088fff] to-emerald-400 rounded-full transition-all duration-500"
                                                style={{ width: `${goalProgressPercent}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-light mt-2 leading-relaxed">
                                            {goalProgressPercent >= 100
                                                ? '🎉 Emergency runway fully funded!'
                                                : `₹${Math.max(0, targetSavingsGoal - savedAmount).toLocaleString('en-IN')} needed to reach full safety net.`}
                                        </p>
                                    </div>

                                    {/* Manual Deposit Controls */}
                                    <div className="space-y-3 pt-2 border-t border-white/10">
                                        <span className="text-[10px] uppercase tracking-widest font-mono text-white/50 block">
                                            Manual Vault Deposit:
                                        </span>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleQuickDeposit(5000)}
                                                className="py-2 px-2 bg-white/5 hover:bg-[#088fff] hover:text-white border border-white/15 text-[11px] font-mono text-white rounded-sm transition-all cursor-pointer"
                                            >
                                                + ₹5,000
                                            </button>
                                            <button
                                                onClick={() => handleQuickDeposit(15000)}
                                                className="py-2 px-2 bg-white/5 hover:bg-[#088fff] hover:text-white border border-white/15 text-[11px] font-mono text-white rounded-sm transition-all cursor-pointer"
                                            >
                                                + ₹15,000
                                            </button>
                                            <button
                                                onClick={() => handleQuickDeposit(30000)}
                                                className="py-2 px-2 bg-white/5 hover:bg-emerald-600 hover:text-white border border-white/15 text-[11px] font-mono text-white rounded-sm transition-all cursor-pointer"
                                            >
                                                + ₹30,000
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSaveVault} className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-sm">
                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Current Saved Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={editVaultCurrent}
                                            onChange={(e) => setEditVaultCurrent(e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/15 text-xs text-white p-2 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Target Savings Goal (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={editVaultTarget}
                                            onChange={(e) => setEditVaultTarget(e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/15 text-xs text-white p-2 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingVault(false)}
                                            className="w-1/2 py-1.5 text-xs bg-white/10 text-white border border-white/10 rounded-sm cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="w-1/2 py-1.5 text-xs font-bold bg-[#088fff] text-white rounded-sm flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save Vault</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
                            <span>User Managed Vault</span>
                            <span className="text-emerald-400 font-bold">Encrypted Ledger</span>
                        </div>
                    </div>

                    {/* Bento Card 3: Category Budget Limits & Health */}
                    <div className="lg:col-span-4 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between h-full min-h-[480px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        Category Budget Limits
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                                    className="text-[10px] uppercase tracking-widest font-bold bg-[#1A1A1A] hover:bg-[#088fff] text-white px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Limit</span>
                                </button>
                            </div>

                            {/* Add Category Form */}
                            {showCategoryForm && (
                                <form onSubmit={handleAddCategory} className="mb-4 p-3 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Category Name"
                                            value={newCatName}
                                            onChange={(e) => setNewCatName(e.target.value)}
                                            className="text-xs p-2 bg-white border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Limit (₹)"
                                            value={newCatLimit}
                                            onChange={(e) => setNewCatLimit(e.target.value)}
                                            className="text-xs p-2 bg-white border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCategoryForm(false)}
                                            className="text-[10px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-2 py-1 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="text-[10px] uppercase font-bold bg-[#088fff] text-white px-3 py-1 rounded-sm cursor-pointer"
                                        >
                                            Save Limit
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Categories List with Live User Expenses */}
                            <div className="space-y-4">
                                {telemetry.categories.map((cat, idx) => {
                                    const matchingBudget = (budget.categories || []).find(b => b.name.toLowerCase().includes(cat.name.toLowerCase()));
                                    const limit = matchingBudget ? matchingBudget.allocated : (cat.amount > 0 ? cat.amount * 1.25 : 15000);
                                    const percent = limit > 0 ? Math.min(100, Math.round((cat.amount / limit) * 100)) : 0;
                                    const isWarning = percent >= 90;

                                    return (
                                        <div key={idx} className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                                    {cat.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                                                        ₹{cat.amount.toLocaleString('en-IN')} <span className="text-[#1A1A1A]/40 font-normal">/ ₹{Math.round(limit).toLocaleString('en-IN')}</span>
                                                    </span>
                                                    {matchingBudget && (
                                                        <button
                                                            onClick={() => handleDeleteCategory(budget.categories.indexOf(matchingBudget))}
                                                            className="text-[#1A1A1A]/30 hover:text-rose-600 p-0.5 cursor-pointer"
                                                            title="Delete limit cap"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${isWarning ? 'bg-rose-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-center text-[9px] font-mono text-[#1A1A1A]/50 mt-1">
                                                <span>{percent}% Spent</span>
                                                <span className={isWarning ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                                                    {isWarning ? 'Near Cap Limit' : 'Within Allocation'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[10px] font-mono text-[#1A1A1A]/50">
                            <span>User Controlled Caps</span>
                            <TrendingUp className="w-3.5 h-3.5 text-[#088fff]" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BudgetSavingsSection;
