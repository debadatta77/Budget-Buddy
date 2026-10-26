import { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, ShieldCheck, Target, Plus, Sliders, CheckCircle2, RotateCcw, Edit3, Trash2, Save, X } from 'lucide-react';
import { 
    getUserBudget, 
    saveUserBudget, 
    getUserVault,
    saveUserVault,
    getUserTransactions,
    calculateFinancialTelemetry,
    EXPENSE_CATEGORIES,
    normalizeCategoryName,
    normalizeBudgetCategories,
    syncAllFromBackend
} from '../../services/userDataService';
import { budgetAPI, TOKEN_STORAGE_KEY } from '../../services/apiClient';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { useCurrency } from '../../utils/formatCurrency';

export const BudgetSavingsSection = () => {
    const { symbol, formatCurrency, formatCompact } = useCurrency();
    // Dynamic Telemetry & User Data State
    const [telemetry, setTelemetry] = useState(calculateFinancialTelemetry());
    const [budget, setBudget] = useState(getUserBudget());
    const [vault, setVault] = useState(getUserVault());
    const [transactions, setTransactions] = useState(() => getUserTransactions());

    // Category Limit Reset Confirmation State
    const [pendingResetCategory, setPendingResetCategory] = useState(null);

    // Vault Edit State
    const [isEditingVault, setIsEditingVault] = useState(false);
    const [editVaultCurrent, setEditVaultCurrent] = useState(vault.current);
    const [editVaultTarget, setEditVaultTarget] = useState(vault.target);

    // Custom Deposit Modal / Input State
    const [customDeposit, setCustomDeposit] = useState('');

    // Category Cap Form State
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCatName, setNewCatName] = useState(EXPENSE_CATEGORIES[0]);
    const [newCatLimit, setNewCatLimit] = useState('');

    // Category Edit State (by category name)
    const [editingCategoryName, setEditingCategoryName] = useState(null);
    const [editCatLimit, setEditCatLimit] = useState('');

    useEffect(() => {
        const handleSync = () => {
            setTelemetry(calculateFinancialTelemetry());
            setBudget(getUserBudget());
            setVault(getUserVault());
            setTransactions(getUserTransactions());
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, []);

    // Sync live transactions + budget from MongoDB Atlas on mount
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            syncAllFromBackend();
            budgetAPI.get().then(res => {
                if (res?.success && res.data) {
                    const normalized = {
                        ...res.data,
                        monthlyIncome: Number(res.data.monthlyIncome || 0),
                        categories: normalizeBudgetCategories(res.data.categories || [])
                    };
                    setBudget(normalized);
                    localStorage.setItem('budget_buddy_user_budget', JSON.stringify(normalized));
                }
            }).catch(err => {
                console.warn('Could not sync budget from backend:', err);
            });
        }
    }, []);

    const handleIncomeChange = (newVal) => {
        const updated = { ...budget, monthlyIncome: Number(newVal) };
        saveUserBudget(updated);
        setBudget(getUserBudget());
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

    // Helper to get live spending for a category from user transactions
    const getCategorySpend = (categoryName) => {
        const canonical = normalizeCategoryName(categoryName);
        const matchingTxs = transactions.filter(
            t => t.type === 'expense' && normalizeCategoryName(t.category) === canonical
        );
        const spent = matchingTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        return { spent, count: matchingTxs.length };
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (!newCatName || !newCatLimit || isNaN(newCatLimit)) return;

        const canonicalName = normalizeCategoryName(newCatName);
        const limitVal = Math.max(0, Number(newCatLimit));
        const currentCategories = normalizeBudgetCategories(budget.categories || []);

        const exists = currentCategories.some(c => normalizeCategoryName(c.name) === canonicalName);
        const updatedCategories = exists
            ? currentCategories.map(c =>
                normalizeCategoryName(c.name) === canonicalName
                    ? { ...c, name: canonicalName, allocated: limitVal }
                    : c
              )
            : [...currentCategories, { id: Date.now().toString(), name: canonicalName, allocated: limitVal, color: '#088fff' }];

        const updatedBudget = { ...budget, categories: updatedCategories };
        saveUserBudget(updatedBudget);
        setBudget(getUserBudget());

        setNewCatLimit('');
        setShowCategoryForm(false);
    };

    const handleStartEditCategory = (cat) => {
        setEditingCategoryName(cat.name);
        setEditCatLimit(cat.allocated > 0 ? String(cat.allocated) : '');
        setShowCategoryForm(false);
    };

    const handleSaveEditedCategory = (e) => {
        e.preventDefault();
        if (!editingCategoryName || editCatLimit === '' || isNaN(editCatLimit)) return;

        const canonicalTarget = normalizeCategoryName(editingCategoryName);
        const currentCategories = normalizeBudgetCategories(budget.categories || []);
        const updatedCategories = currentCategories.map(c =>
            normalizeCategoryName(c.name) === canonicalTarget
                ? { ...c, allocated: Math.max(0, Number(editCatLimit)) }
                : c
        );

        const updatedBudget = { ...budget, categories: updatedCategories };
        saveUserBudget(updatedBudget);
        setBudget(getUserBudget());
        setEditingCategoryName(null);
        setEditCatLimit('');
    };

    const handleResetCategoryLimit = (categoryName) => {
        const canonicalTarget = normalizeCategoryName(categoryName);
        const currentCategories = normalizeBudgetCategories(budget.categories || []);
        const isCoreCategory = EXPENSE_CATEGORIES.includes(canonicalTarget);

        const updatedCategories = isCoreCategory
            ? currentCategories.map(c =>
                normalizeCategoryName(c.name) === canonicalTarget
                    ? { ...c, allocated: 0 }
                    : c
              )
            : currentCategories.filter(c => normalizeCategoryName(c.name) !== canonicalTarget);

        const updatedBudget = { ...budget, categories: updatedCategories };
        saveUserBudget(updatedBudget);
        setBudget(getUserBudget());
        if (editingCategoryName === categoryName) {
            setEditingCategoryName(null);
        }
    };

    // Build unified central categories list (merging EXPENSE_CATEGORIES + any custom categories + live spend)
    const unifiedCategories = normalizeBudgetCategories(budget.categories || []).map(cat => {
        const { spent, count } = getCategorySpend(cat.name);
        const limit = Number(cat.allocated || 0);
        const rawPercent = limit > 0 ? (spent / limit) * 100 : 0;
        const displayPercent =
            limit > 0
                ? spent === 0
                    ? 0
                    : rawPercent < 10 && rawPercent % 1 !== 0
                    ? Number(rawPercent.toFixed(1))
                    : Math.round(rawPercent)
                : 0;
        return {
            ...cat,
            spentAmount: spent,
            txCount: count,
            limit,
            rawPercent,
            displayPercent,
            isOver: limit > 0 && spent > limit,
            isNear: limit > 0 && rawPercent >= 85 && spent <= limit
        };
    }).sort((a, b) => {
        // Active categories (with spending or limit set) always appear at the top
        const aActive = a.spentAmount > 0 || a.limit > 0 ? 1 : 0;
        const bActive = b.spentAmount > 0 || b.limit > 0 ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;
        if (b.spentAmount !== a.spentAmount) return b.spentAmount - a.spentAmount;
        return b.limit - a.limit;
    });

    // Calculations based on user inputs
    const activeIncome = budget.monthlyIncome > 0 ? budget.monthlyIncome : (telemetry.summary.totalIncome || 0);
    const needsAmount = Math.round(activeIncome * 0.5);
    const wantsAmount = Math.round(activeIncome * 0.3);
    const savingsAmount = Math.round(activeIncome * 0.2);

    const savedAmount = Number(vault.current || 0);
    const targetSavingsGoal = Number(vault.target || 100000);
    const goalProgressPercent = targetSavingsGoal > 0 ? Math.min(100, Math.round((savedAmount / targetSavingsGoal) * 100)) : 0;
    const totalCategoryLimit = unifiedCategories.reduce((acc, c) => acc + Number(c.limit || 0), 0);
    const totalCategorySpent = unifiedCategories.reduce((acc, c) => acc + Number(c.spentAmount || 0), 0);
    const remainingCapBuffer = Math.max(0, totalCategoryLimit - totalCategorySpent);
    const overallCapPercent = totalCategoryLimit > 0 ? Math.min(100, Math.round((totalCategorySpent / totalCategoryLimit) * 100)) : 0;
    const activeCapsCount = unifiedCategories.filter(c => c.limit > 0).length;
    const monthsToGoal = savingsAmount > 0 && targetSavingsGoal > savedAmount
        ? Math.ceil((targetSavingsGoal - savedAmount) / savingsAmount)
        : 0;

    return (
        <section id="savings" className="bg-[#F9F8F5] text-[#1A1A1A] pt-4 pb-20 lg:pt-6 lg:pb-24 border-b border-[#1A1A1A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-8 pb-6 border-b border-[#1A1A1A]/10">
                    <div className="lg:col-span-7">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2.5 font-mono">
                            BUDGETING & WEALTH ALLOCATION ENGINE
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
                            MANAGE YOUR <br />
                            <span className="italic text-[#088fff]">WEALTH</span> ALLOCATION
                        </h2>
                    </div>

                    <div className="lg:col-span-5">
                        <p className="text-sm sm:text-base text-[#1A1A1A]/80 font-light leading-relaxed font-sans-clean">
                            Allocate your monthly income across the 50/30/20 framework, build your emergency vault, and enforce category spending caps synced directly with your expense ledger.
                        </p>
                    </div>
                </div>

                {/* Top 4 KPI Summary Strip (Eliminates Empty Header Void & Anchors Layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className="bg-white rounded-sm p-5 shadow-sm border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Monthly Income
                            </span>
                            <Sliders className="w-3.5 h-3.5 text-[#088fff]" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-editorial font-bold text-[#1A1A1A]">
                            {formatCurrency(activeIncome)}
                        </div>
                        <span className="text-[10px] font-mono text-[#1A1A1A]/50 mt-1 pt-1 border-t border-[#1A1A1A]/10">
                            Active 50/30/20 Base Income
                        </span>
                    </div>

                    <div className="bg-white rounded-sm p-5 shadow-sm border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Living Allowance (80%)
                            </span>
                            <TrendingUp className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-editorial font-bold text-[#1A1A1A]">
                            {formatCurrency(needsAmount + wantsAmount)}
                        </div>
                        <span className="text-[10px] font-mono text-[#1A1A1A]/50 mt-1 pt-1 border-t border-[#1A1A1A]/10">
                            Needs {formatCurrency(needsAmount)} • Wants {formatCurrency(wantsAmount)}
                        </span>
                    </div>

                    <div className="bg-white rounded-sm p-5 shadow-sm border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Savings & SIP (20%)
                            </span>
                            <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-editorial font-bold text-emerald-600">
                            {formatCurrency(savingsAmount)}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700/80 mt-1 pt-1 border-t border-[#1A1A1A]/10">
                            Recommended Monthly Retention
                        </span>
                    </div>

                    <div className="bg-white rounded-sm p-5 shadow-sm border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Category Spending Caps
                            </span>
                            <Target className="w-3.5 h-3.5 text-[#088fff]" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-editorial font-bold text-[#088fff]">
                            {formatCurrency(totalCategoryLimit)}
                        </div>
                        <span className="text-[10px] font-mono text-[#1A1A1A]/50 mt-1 pt-1 border-t border-[#1A1A1A]/10">
                            {activeCapsCount} of {unifiedCategories.length} Expense Categories Capped
                        </span>
                    </div>
                </div>

                {/* Main Bento Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Bento Card 1: 50/30/20 Rule Dynamic Allocator */}
                    <div className="lg:col-span-4 bg-white rounded-sm p-6 sm:p-7 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-5">
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        50 / 30 / 20 Rule Engine
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-[#088fff] bg-[#088fff]/10 px-2 py-0.5 rounded">
                                    LIVE ALLOCATOR
                                </span>
                            </div>

                            {/* Monthly Income Input */}
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-[#1A1A1A]/80 uppercase tracking-wider">
                                        Monthly Income ({symbol})
                                    </label>
                                    {telemetry.summary.totalIncome > 0 && activeIncome !== telemetry.summary.totalIncome && (
                                        <button
                                            type="button"
                                            onClick={() => handleIncomeChange(telemetry.summary.totalIncome)}
                                            className="text-[10px] font-mono font-bold text-[#088fff] hover:underline flex items-center gap-1 cursor-pointer"
                                            title="Reset to actual recorded monthly income"
                                        >
                                            <RotateCcw className="w-2.5 h-2.5" />
                                            <span>Sync Ledger ({formatCurrency(telemetry.summary.totalIncome)})</span>
                                        </button>
                                    )}
                                </div>
                                <div className="relative flex items-center mb-3">
                                    <span className="absolute left-3 text-base font-mono font-bold text-[#1A1A1A]/50 select-none">
                                        {symbol}
                                    </span>
                                    <input
                                        type="number"
                                        value={activeIncome}
                                        onChange={(e) => handleIncomeChange(e.target.value)}
                                        className="w-full text-xl font-editorial font-bold text-[#1A1A1A] font-mono pl-8 pr-20 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                        placeholder="Enter monthly income"
                                    />
                                    <span className="absolute right-3 text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/40 font-bold select-none">
                                        / Month
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="500000"
                                    step="5000"
                                    value={activeIncome}
                                    onChange={(e) => handleIncomeChange(e.target.value)}
                                    className="w-full h-2 bg-[#1A1A1A]/10 rounded-lg appearance-none cursor-pointer accent-[#088fff]"
                                />
                                <div className="flex justify-between text-[10px] text-[#1A1A1A]/40 font-mono mt-1">
                                    <span>{formatCurrency(0)}</span>
                                    <span>{formatCompact(250000)}</span>
                                    <span>{formatCompact(500000)}</span>
                                </div>
                            </div>

                            {/* 3-Tier Allocation Breakdown */}
                            <div className="space-y-3.5 pt-1">
                                {/* Needs 50% */}
                                <div className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                            50% Needs <span className="text-[10px] font-mono text-[#1A1A1A]/50">(Rent, Groceries, Utilities)</span>
                                        </span>
                                        <span className="text-sm font-bold text-[#1A1A1A] font-mono">
                                            {formatCurrency(needsAmount)}
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
                                            {formatCurrency(wantsAmount)}
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
                                            {formatCurrency(savingsAmount)}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600" style={{ width: '20%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-[#F9F8F5] border border-emerald-600/30 border-l-4 border-l-emerald-600 rounded-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Recommended Monthly SIP</span>
                                </span>
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-xs bg-emerald-600 text-white">
                                    20% Wealth Rule
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <div>
                                    <span className="text-xl font-editorial font-bold text-emerald-700">
                                        {formatCurrency(savingsAmount)}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#1A1A1A]/60 ml-1">/ month</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] font-mono font-bold text-[#1A1A1A]">
                                        {formatCurrency(savingsAmount * 12)}/yr
                                    </span>
                                    <span className="block text-[9px] font-mono text-[#1A1A1A]/55">
                                        1-Yr Principal Corpus
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Card 2: Emergency Savings Reserve Vault */}
                    <div className="lg:col-span-4 bg-[#1A1A1A] text-[#F9F8F5] rounded-sm p-6 sm:p-7 shadow-xl border border-[#1A1A1A] flex flex-col justify-between relative overflow-hidden">
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
                                                {formatCurrency(savedAmount)}
                                            </span>
                                            <span className="text-sm font-mono text-white/60">
                                                / {formatCurrency(targetSavingsGoal)}
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
                                                : `${formatCurrency(Math.max(0, targetSavingsGoal - savedAmount))} needed to reach full safety net.`}
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
                                                + {formatCurrency(5000)}
                                            </button>
                                            <button
                                                onClick={() => handleQuickDeposit(15000)}
                                                className="py-2 px-2 bg-white/5 hover:bg-[#088fff] hover:text-white border border-white/15 text-[11px] font-mono text-white rounded-sm transition-all cursor-pointer"
                                            >
                                                + {formatCurrency(15000)}
                                            </button>
                                            <button
                                                onClick={() => handleQuickDeposit(30000)}
                                                className="py-2 px-2 bg-white/5 hover:bg-emerald-600 hover:text-white border border-white/15 text-[11px] font-mono text-white rounded-sm transition-all cursor-pointer"
                                            >
                                                + {formatCurrency(30000)}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSaveVault} className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-sm">
                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Current Saved Amount ({symbol})
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
                                            Target Savings Goal ({symbol})
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

                        <div className="mt-5 p-3.5 bg-white/5 border border-white/15 border-l-4 border-l-[#088fff] rounded-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#088fff]">
                                    Vault Runway Projection
                                </span>
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-400">
                                    Encrypted Ledger
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xs font-mono text-white/90 font-semibold">
                                    {goalProgressPercent >= 100
                                        ? 'Target Reserve Complete'
                                        : monthsToGoal > 0
                                        ? `~${monthsToGoal} ${monthsToGoal === 1 ? 'Month' : 'Months'} at ${formatCurrency(savingsAmount)}/mo SIP`
                                        : 'Set Income to Project Pace'}
                                </span>
                                <span className="text-[10px] font-mono text-white/50">
                                    {goalProgressPercent}% Funded
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Card 3: Category Budget Limits & Health */}
                    <div className="lg:col-span-4 bg-white rounded-sm p-6 sm:p-7 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-5">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        Category Budget Limits
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-[#088fff] bg-[#088fff]/10 px-2 py-0.5 rounded">
                                    AUTO-SYNCED
                                </span>
                            </div>

                            {/* Centralized Expense Categories List */}
                            <div className="space-y-2.5 max-h-[370px] overflow-y-auto pr-1">
                                {unifiedCategories.map((cat) => {
                                    const { name, spentAmount, txCount, limit, rawPercent, displayPercent, isOver, isNear } = cat;

                                    if (editingCategoryName === name) {
                                        return (
                                            <form key={name} onSubmit={handleSaveEditedCategory} className="p-3 bg-white border-2 border-[#088fff] rounded-sm shadow-sm space-y-2">
                                                <div className="text-[10px] uppercase font-mono font-bold text-[#088fff] flex items-center justify-between">
                                                    <span>Set Monthly Cap: {name}</span>
                                                    <span className="text-[9px] text-[#1A1A1A]/60 font-mono">
                                                        Logged Spend: {formatCurrency(spentAmount)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-mono text-[#1A1A1A]/60 block mb-1">Monthly Limit ({symbol})</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter category limit (e.g. 1000)"
                                                        value={editCatLimit}
                                                        onChange={(e) => setEditCatLimit(e.target.value)}
                                                        className="w-full text-xs p-2 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                                        min="0"
                                                        required
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-1 border-t border-[#1A1A1A]/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingCategoryName(null)}
                                                        className="text-[10px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-2 py-1 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="text-[10px] uppercase font-bold bg-[#088fff] hover:bg-[#0070d6] text-white px-3 py-1 rounded-sm flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Save className="w-3 h-3" />
                                                        <span>Save Cap</span>
                                                    </button>
                                                </div>
                                            </form>
                                        );
                                    }

                                    const barWidth =
                                        limit > 0
                                            ? Math.min(100, Math.max(spentAmount > 0 ? 4 : 0, rawPercent))
                                            : spentAmount > 0
                                            ? 100
                                            : 0;

                                    return (
                                        <div
                                            key={name}
                                            className={`p-3 rounded-sm border transition-colors ${
                                                spentAmount > 0 || limit > 0
                                                    ? 'bg-[#F9F8F5] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30'
                                                    : 'bg-[#F9F8F5]/50 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                                        {name}
                                                    </span>
                                                    {txCount > 0 && (
                                                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-[#088fff]/10 text-[#088fff] font-bold">
                                                            {txCount} {txCount === 1 ? 'log' : 'logs'}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    {limit > 0 ? (
                                                        <>
                                                            <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                                                                {formatCurrency(spentAmount)}{' '}
                                                                <span className="text-[#1A1A1A]/40 font-normal">/ {formatCurrency(limit)}</span>
                                                            </span>
                                                            <button
                                                                onClick={() => handleStartEditCategory(cat)}
                                                                className="text-[#1A1A1A]/40 hover:text-[#088fff] p-1 rounded hover:bg-white cursor-pointer transition-colors"
                                                                title="Edit limit"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setPendingResetCategory(cat)}
                                                                className="text-[#1A1A1A]/40 hover:text-rose-600 p-1 rounded hover:bg-white cursor-pointer transition-colors"
                                                                title="Reset limit"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs font-mono font-bold text-[#1A1A1A]/80 mr-1">
                                                                {formatCurrency(spentAmount)}{' '}
                                                                <span className="text-[10px] text-[#1A1A1A]/40 font-normal">spent</span>
                                                            </span>
                                                            <button
                                                                onClick={() => handleStartEditCategory(cat)}
                                                                className="text-[9px] font-mono uppercase tracking-wider font-bold text-[#088fff] hover:text-white bg-[#088fff]/10 hover:bg-[#088fff] px-2 py-1 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
                                                                title="Set category limit"
                                                            >
                                                                <Edit3 className="w-2.5 h-2.5" />
                                                                <span>Set Limit</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        limit === 0
                                                            ? 'bg-[#088fff]/40'
                                                            : isOver
                                                            ? 'bg-rose-600'
                                                            : isNear
                                                            ? 'bg-amber-500'
                                                            : 'bg-emerald-600'
                                                    }`}
                                                    style={{ width: `${barWidth}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-center text-[9px] font-mono text-[#1A1A1A]/55 mt-1">
                                                <span>
                                                    {limit > 0 ? `${displayPercent}% Spent` : spentAmount > 0 ? 'Active Expense Log' : '0% Spent'}
                                                </span>
                                                <span
                                                    className={
                                                        limit === 0
                                                            ? spentAmount > 0
                                                                ? 'text-[#088fff] font-bold'
                                                                : 'text-[#1A1A1A]/40'
                                                            : isOver
                                                            ? 'text-rose-600 font-bold'
                                                            : isNear
                                                            ? 'text-amber-600 font-bold'
                                                            : 'text-emerald-700 font-semibold'
                                                    }
                                                >
                                                    {limit === 0
                                                        ? spentAmount > 0
                                                            ? 'Set Limit to Track %'
                                                            : 'No Cap Set'
                                                        : isOver
                                                        ? `Exceeded by ${formatCurrency(spentAmount - limit)}`
                                                        : isNear
                                                        ? `Near Cap · ${formatCurrency(limit - spentAmount)} left`
                                                        : `Within Allocation · ${formatCurrency(limit - spentAmount)} left`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-5 p-3.5 bg-gradient-to-r from-[#088fff]/10 via-[#088fff]/5 to-[#F9F8F5] border border-[#088fff]/30 border-l-4 border-l-[#088fff] rounded-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#088fff] flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-[#088fff] shrink-0" />
                                    <span>Category Cap Utilization</span>
                                </span>
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-xs bg-[#1A1A1A] text-white">
                                    {activeCapsCount} / {unifiedCategories.length} Capped
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <div>
                                    <span className="text-xl font-editorial font-bold text-[#1A1A1A]">
                                        {formatCurrency(totalCategorySpent)}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#1A1A1A]/60 ml-1">
                                        / {formatCurrency(totalCategoryLimit)} cap
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[11px] font-mono font-bold ${totalCategoryLimit > 0 && totalCategorySpent > totalCategoryLimit ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {totalCategoryLimit > 0
                                            ? totalCategorySpent > totalCategoryLimit
                                                ? `Over by ${formatCurrency(totalCategorySpent - totalCategoryLimit)}`
                                                : `${formatCurrency(remainingCapBuffer)} Safe Buffer`
                                            : 'Set Caps Above'}
                                    </span>
                                    <span className="block text-[9px] font-mono text-[#1A1A1A]/55">
                                        {totalCategoryLimit > 0 ? `${overallCapPercent}% Total Cap Used` : '12 Central Categories'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Category Limit Reset Modal */}
            <ConfirmDeleteModal
                isOpen={Boolean(pendingResetCategory)}
                onClose={() => setPendingResetCategory(null)}
                onConfirm={() => {
                    if (pendingResetCategory) {
                        handleResetCategoryLimit(pendingResetCategory.name);
                        setPendingResetCategory(null);
                    }
                }}
                title="Reset Category Limit?"
                itemName={pendingResetCategory?.name}
                itemDetails={pendingResetCategory ? `Current Cap: ${formatCurrency(Number(pendingResetCategory.limit || pendingResetCategory.allocated || 0))}` : ''}
                message="Are you sure you want to reset the monthly spending limit for this category? The cap will be removed, but all your transaction history remains safe."
                confirmText="Reset Cap"
                dangerLevel="medium"
            />
        </section>
    );
};

export default BudgetSavingsSection;
