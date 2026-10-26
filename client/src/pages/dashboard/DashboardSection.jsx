import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownRight, 
    ArrowDownLeft,
    Activity, 
    TrendingUp, 
    Plus, 
    Sparkles, 
    ShieldCheck, 
    PieChart, 
    Clock,
    X,
    Trash2,
    ArrowRight,
    Calendar,
    Target,
    CheckCircle2,
    CreditCard
} from 'lucide-react';
import { 
    getUserTransactions, 
    addUserTransaction, 
    deleteUserTransaction, 
    calculateFinancialTelemetry,
    getUserVault,
    getUserLiabilitiesSummary
} from '../../services/userDataService';
import { HealthScoreModal, calculateHealthBreakdown } from '../../components/modals/HealthScoreModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { useCurrency } from '../../utils/formatCurrency';

export const DashboardSection = () => {
    const navigate = useNavigate();
    const { symbol, formatCurrency } = useCurrency();

    // Dynamic User Telemetry State
    const [telemetry, setTelemetry] = useState(calculateFinancialTelemetry());
    const [transactions, setTransactions] = useState(getUserTransactions());
    const [vault, setVault] = useState(getUserVault());
    const [liabilities, setLiabilities] = useState(() => getUserLiabilitiesSummary());
    const [timeRange, setTimeRange] = useState('Monthly');

    // Add Expense Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHealthModal, setShowHealthModal] = useState(false);
    const [pendingDeleteTx, setPendingDeleteTx] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newCategory, setNewCategory] = useState('Groceries');
    const [newType, setNewType] = useState('expense');

    useEffect(() => {
        const handleSync = () => {
            setTelemetry(calculateFinancialTelemetry());
            setTransactions(getUserTransactions());
            setVault(getUserVault());
            setLiabilities(getUserLiabilitiesSummary());
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, []);

    const { summary } = telemetry;
    const { totalIncome, totalExpense, netSavings, netWorth, totalVaultSavings } = summary;

    // Helper to parse 'YYYY-MM-DD' dates accurately without timezone shift
    const parseTxDate = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        const cleanStr = String(dateStr).split('T')[0];
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        return new Date(dateStr);
    };

    // Filter user's actual expense transactions strictly by selected time range
    const filteredExpenseTransactions = useMemo(() => {
        const expenseTxs = transactions.filter(t => t.type === 'expense');
        const now = new Date();

        return expenseTxs.filter(tx => {
            const txDate = parseTxDate(tx.date);
            if (!txDate || isNaN(txDate.getTime())) return true;

            if (timeRange === 'Weekly') {
                // Current calendar week (starts Sunday 00:00:00 through Saturday 23:59:59)
                const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0);
                const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59, 999);
                return txDate >= startOfWeek && txDate <= endOfWeek;
            }

            if (timeRange === 'Monthly') {
                // Current calendar month (same year & month)
                return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
            }

            if (timeRange === 'Yearly') {
                // Current calendar year
                return txDate.getFullYear() === now.getFullYear();
            }

            return true;
        });
    }, [transactions, timeRange]);

    // Aggregate category distribution for the selected time range without dummy data
    const { periodTotalExpense, periodCategories } = useMemo(() => {
        const total = filteredExpenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const categoryMap = {};
        const countMap = {};

        filteredExpenseTransactions.forEach(t => {
            const cat = t.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + (Number(t.amount) || 0);
            countMap[cat] = (countMap[cat] || 0) + 1;
        });

        const colorPalette = ['#088fff', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];
        const cats = Object.keys(categoryMap).map((cat, idx) => {
            const amount = categoryMap[cat];
            const percent = total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0;
            return {
                name: cat,
                amount,
                percent,
                color: colorPalette[idx % colorPalette.length],
                count: countMap[cat] || 1
            };
        }).sort((a, b) => b.amount - a.amount);

        return { periodTotalExpense: total, periodCategories: cats };
    }, [filteredExpenseTransactions]);

    // Metric 1: Emergency Vault & Operational Runway Calculation
    const { currentVault, targetVault, vaultProgress, runwayMonths, runwayStatus } = useMemo(() => {
        const current = Number(vault?.current || 0);
        const target = Number(vault?.target || 100000);
        const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const monthlyBurn = totalExpense > 0 ? totalExpense : 0;
        const months = monthlyBurn > 0 ? (current / monthlyBurn).toFixed(1) : (current > 0 ? '∞' : '0.0');

        let status = {
            label: 'Building Buffer',
            badgeColor: 'text-amber-700 bg-amber-50 border-amber-200/80',
            tip: 'Aiming for the 3–6 month emergency living buffer benchmark.'
        };
        if (current === 0) {
            status = {
                label: 'Unfunded Vault',
                badgeColor: 'text-rose-700 bg-rose-50 border-rose-200/80',
                tip: 'Reserves are empty. Allocate surplus funds to insulate against sudden emergencies.'
            };
        } else if (Number(months) >= 6 || months === '∞') {
            status = {
                label: 'Fortified (6+ Mos)',
                badgeColor: 'text-purple-700 bg-purple-50 border-purple-200/80',
                tip: 'Exceptional liquid security exceeding standard personal finance guidelines.'
            };
        } else if (Number(months) >= 3) {
            status = {
                label: 'Optimal (3-6 Mos)',
                badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
                tip: 'Solid foundation meeting certified financial planning benchmarks.'
            };
        }

        return {
            currentVault: current,
            targetVault: target,
            vaultProgress: progress,
            runwayMonths: months,
            runwayStatus: status
        };
    }, [vault, totalExpense]);

    // Centralized AI Financial Health Index
    const healthBreakdown = useMemo(() => {
        return calculateHealthBreakdown(summary, vault, runwayMonths);
    }, [summary, vault, runwayMonths]);
    const { totalScore: healthScore, currentTier: healthTier } = healthBreakdown;

    // Metric 2: Daily Safe-to-Spend & Calendar Cashflow Pacing Calculation
    const { 
        currentDay, 
        daysInCurrentMonth, 
        remainingDaysInMonth, 
        monthPercentElapsed, 
        safeDailySpend, 
        budgetUtilizedPercent, 
        isPacingOptimal 
    } = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const remainingDays = Math.max(1, totalDays - day);
        const monthElapsed = Math.round((day / totalDays) * 100);

        const dailySpend = netSavings > 0 ? Math.round(netSavings / remainingDays) : 0;
        const utilized = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;
        const optimal = utilized <= monthElapsed;

        return {
            currentDay: day,
            daysInCurrentMonth: totalDays,
            remainingDaysInMonth: remainingDays,
            monthPercentElapsed: monthElapsed,
            safeDailySpend: dailySpend,
            budgetUtilizedPercent: utilized,
            isPacingOptimal: optimal
        };
    }, [netSavings, totalIncome, totalExpense]);

    const handleAddTransaction = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newAmount || isNaN(newAmount)) return;

        const val = Number(newAmount);
        const newTx = {
            id: Date.now(),
            title: newTitle.trim(),
            category: newCategory,
            amount: val,
            type: newType,
            date: new Date().toISOString().split('T')[0]
        };

        const updated = addUserTransaction(newTx);
        setTransactions(updated);
        setNewTitle('');
        setNewAmount('');
        setShowAddModal(false);
    };

    const handleDeleteTx = (id) => {
        const updated = deleteUserTransaction(id);
        setTransactions(updated);
    };

    return (
        <section id="dashboard" className="bg-[#F9F8F5] text-[#1A1A1A] pt-4 pb-20 lg:pt-6 lg:pb-24 border-b border-[#1A1A1A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12 pb-8 border-b border-[#1A1A1A]/10">
                    <div className="lg:col-span-7">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-3 font-mono">
                            DASHBOARD / REAL-TIME USER TELEMETRY
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
                            FINANCIAL CONTROL <br />
                            <span className="italic text-[#088fff]">CENTER</span>
                        </h2>
                    </div>

                    <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-base text-[#1A1A1A]/80 font-light leading-relaxed font-sans-clean">
                            Live telemetry on monthly net worth, monthly burn rate, and AI financial health score.
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-5 rounded-sm transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Quick Log</span>
                        </button>
                    </div>
                </div>

                {/* Top 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    
                    {/* Stat Card 1: Monthly Net Worth */}
                    <div className="bg-white rounded-sm p-6 shadow-md border border-[#1A1A1A]/15 flex flex-col justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Monthly Net Worth
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#088fff]/10 flex items-center justify-center text-[#088fff]">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-editorial font-bold text-[#1A1A1A] leading-none mb-2">
                                {formatCurrency(netWorth)}
                            </div>
                            <div className="flex flex-col gap-0.5 text-[10px] font-mono text-[#1A1A1A]/70 pt-1 border-t border-[#1A1A1A]/10">
                                <span className="font-bold text-[#088fff]">Formula: (Income - Burn) + Vault</span>
                                <span>{formatCurrency(totalIncome)} - {formatCurrency(totalExpense)} + {formatCurrency(totalVaultSavings)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 2: Monthly Outflow */}
                    <div className="bg-white rounded-sm p-6 shadow-md border border-[#1A1A1A]/15 flex flex-col justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Monthly Outflow
                            </span>
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-editorial font-bold text-rose-600 leading-none mb-2">
                                {formatCurrency(totalExpense)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-rose-600 pt-1 border-t border-[#1A1A1A]/10">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span className="font-bold">Total Money Spent</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 3: Monthly Inflow */}
                    <div className="bg-white rounded-sm p-6 shadow-md border border-[#1A1A1A]/15 flex flex-col justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Monthly Inflow
                            </span>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <ArrowDownLeft className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-editorial font-bold text-emerald-600 leading-none mb-2">
                                {formatCurrency(totalIncome)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 pt-1 border-t border-[#1A1A1A]/10">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span className="font-bold">Total Money Received</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 4: Financial Health Score (Interactive) */}
                    <div 
                        onClick={() => setShowHealthModal(true)}
                        className="bg-[#1A1A1A] text-white rounded-sm p-6 shadow-md border border-[#1A1A1A] hover:border-[#088fff] flex flex-col justify-between group hover:-translate-y-0.5 transition-all cursor-pointer relative"
                        title="Click to view full scoring calculation and industry tier guide"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold font-mono">
                                AI Health Index
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#088fff]/20 flex items-center justify-center text-[#088fff] transition-colors">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-3xl sm:text-4xl font-editorial font-bold text-white leading-none">
                                    {healthScore}
                                </span>
                                <span className="text-xs font-mono text-white/50">/ 100</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-white/10">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="font-bold text-emerald-400">{healthTier?.label?.toUpperCase() || 'GOOD'}</span>
                                </div>
                                <span className="text-[10px] text-white/40 group-hover:text-[#088fff] flex items-center gap-0.5 transition-colors font-bold uppercase tracking-wider">
                                    4-Pillars →
                                </span>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-white/10 text-[9px] font-mono text-white/50 leading-tight">
                                Savings 30% • Burn 25% • Vault 25% • Debt/EMI 20%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Dependencies & Liabilities Banner (Treated Independently from Liquid Cashflow) */}
                {(liabilities.activeCreditCardsCount > 0 || liabilities.activeEmisCount > 0) && (
                    <div className="mb-8 p-5 sm:p-6 bg-gradient-to-r from-[#1A1A1A] via-slate-900 to-[#1A1A1A] text-white rounded-sm border border-white/10 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-sm bg-[#088fff]/15 border border-[#088fff]/30 flex items-center justify-center shrink-0">
                                <CreditCard className="w-6 h-6 text-[#088fff]" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#088fff]">
                                        FINANCIAL LIABILITIES & DEPENDENCIES
                                    </span>
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                                        Liquid Cash Protected
                                    </span>
                                </div>
                                <p className="text-xs text-white/70 font-sans-clean max-w-2xl">
                                    Credit card dues & loan EMIs are monitored as recurring debt dependencies. They do not deduct or force negative figures on your liquid savings balance.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10 shrink-0">
                            <div>
                                <div className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                                    Total Credit Dues
                                </div>
                                <div className="text-base sm:text-lg font-bold font-editorial text-white">
                                    {formatCurrency(liabilities.totalCreditDue)}
                                    <span className="text-[11px] font-mono font-normal text-white/50 ml-1.5">
                                        ({liabilities.creditUtilization}% utilized)
                                    </span>
                                </div>
                            </div>

                            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

                            <div>
                                <div className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                                    Monthly EMI Obligations
                                </div>
                                <div className="text-base sm:text-lg font-bold font-editorial text-amber-300">
                                    {formatCurrency(liabilities.totalMonthlyEmi)}
                                    <span className="text-[11px] font-mono font-normal text-white/50 ml-1.5">
                                        /mo
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/emi-studio')}
                                className="px-4 py-2.5 rounded-sm bg-white/10 hover:bg-[#088fff] text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-2"
                            >
                                <span>EMI Studio</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Dashboard Interactive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Spending Breakdown Telemetry */}
                    <div className="lg:col-span-7 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#1A1A1A]/10 mb-6 gap-3">
                                <div className="flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-[#088fff]" />
                                    <h3 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                                        User Expense Distribution & Telemetry
                                    </h3>
                                </div>

                                {/* Time Range Selector */}
                                <div className="flex items-center gap-1 bg-[#F9F8F5] p-1 border border-[#1A1A1A]/10 rounded-sm">
                                    {['Weekly', 'Monthly', 'Yearly'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            className={`text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-sm transition-all cursor-pointer ${
                                                timeRange === range
                                                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                                                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {periodCategories.length === 0 ? (
                                /* Industry-Standard Attractive Empty State */
                                <div className="py-10 px-6 my-2 bg-[#F9F8F5]/80 border border-dashed border-[#1A1A1A]/15 rounded-sm text-center flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-[#088fff]/10 text-[#088fff] flex items-center justify-center mb-3 ring-4 ring-[#088fff]/5">
                                        <PieChart className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full mb-2">
                                        0% Outflow • 100% Cashflow Retained
                                    </span>
                                    <h4 className="text-base font-editorial font-bold text-[#1A1A1A] mb-1">
                                        No Outflows Recorded for this {timeRange} Cycle
                                    </h4>
                                    <p className="text-xs text-[#1A1A1A]/60 max-w-sm font-sans-clean leading-relaxed mb-5">
                                        Your {timeRange.toLowerCase()} expenditure telemetry is completely clear. Log an expense to dynamically calibrate your category distribution bar.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setNewType('expense');
                                            setShowAddModal(true);
                                        }}
                                        className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-[11px] uppercase tracking-widest font-bold py-2.5 px-4 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Log {timeRange} Expense</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Stacked Visual Bar */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center text-xs font-mono text-[#1A1A1A]/70 mb-2">
                                            <span>Total {timeRange} Expenses: {formatCurrency(periodTotalExpense)}</span>
                                            <span className="font-bold text-[#088fff]">
                                                {periodCategories.length} {periodCategories.length === 1 ? 'Category' : 'Categories'}
                                            </span>
                                        </div>
                                        <div className="w-full h-4 bg-[#1A1A1A]/5 rounded-sm overflow-hidden flex">
                                            {periodCategories.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="h-full transition-all duration-300 border-r border-white/20"
                                                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                                                    title={`${item.name}: ${formatCurrency(item.amount)} (${item.percent}%)`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detailed Category Rows */}
                                    <div className="space-y-3">
                                        {periodCategories.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm hover:border-[#1A1A1A]/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <div>
                                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean block">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-[10px] text-[#1A1A1A]/50 font-mono">
                                                            {item.count} {item.count === 1 ? 'entry' : 'entries'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                                                        {formatCurrency(item.amount)}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold bg-[#1A1A1A]/5 px-2 py-0.5 rounded text-[#1A1A1A]/70 min-w-[48px] text-right">
                                                        {item.percent}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[10px] font-mono text-[#1A1A1A]/50">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                <span>
                                    Telemetry Filter: <strong className="text-[#1A1A1A] uppercase">{timeRange}</strong>
                                    <span className="text-[#1A1A1A]/40 text-[9px] ml-1 hidden sm:inline">
                                        {timeRange === 'Weekly' && '(This Calendar Week: Sun – Sat)'}
                                        {timeRange === 'Monthly' && `(Calendar Month: ${new Date().toLocaleString('en-US', { month: 'short' })} ${new Date().getFullYear()})`}
                                        {timeRange === 'Yearly' && `(Calendar Year: ${new Date().getFullYear()})`}
                                    </span>
                                </span>
                            </span>
                            <span className="flex items-center gap-1 text-[#088fff] font-bold">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                <span>Live Telemetry Engine</span>
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Command Ledger & Activity Feed */}
                    <div id="expenses" className="lg:col-span-5 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-5 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#088fff]" />
                                    <h3 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                                        Live User Activity Feed
                                    </h3>
                                </div>
                                <span className="text-[10px] font-mono text-[#1A1A1A]/40 uppercase font-bold">
                                    {transactions.length} Entries
                                </span>
                            </div>

                            {/* Activity Feed List */}
                            <div className="divide-y divide-[#1A1A1A]/10">
                                {transactions.length === 0 ? (
                                    <div className="py-8 text-center text-xs font-mono text-[#1A1A1A]/50">
                                        No recent transactions. Add your custom transactions above!
                                    </div>
                                ) : (
                                    transactions.slice(0, 5).map((tx) => (
                                        <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-[#F9F8F5]/80 px-1 rounded-sm transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                    tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                    {tx.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-[#1A1A1A] font-sans-clean truncate max-w-[160px]">
                                                        {tx.title}
                                                    </h5>
                                                    <span className="text-[10px] text-[#1A1A1A]/50 font-mono">
                                                        {tx.category} • {tx.date}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-mono font-bold ${
                                                    tx.type === 'income' ? 'text-emerald-700' : 'text-[#1A1A1A]'
                                                }`}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingDeleteTx(tx)}
                                                    className="text-[#1A1A1A]/30 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                                    title="Delete transaction"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase font-semibold">
                                {transactions.length > 5 ? `Showing 5 of ${transactions.length} entries` : 'Recent Activity Stream'}
                            </span>
                            <button
                                onClick={() => navigate('/expenses')}
                                className="text-[11px] uppercase tracking-widest font-bold text-[#088fff] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <span>View Full Ledger</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Row 3: Executive Operational Horizon Grid (Emergency Vault & Daily Cashflow Velocity) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-stretch">
                    
                    {/* Card 1: Emergency Vault & Operational Runway */}
                    <div className="bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between pb-5 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#088fff]" />
                                    <h3 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                                        Emergency Vault & Runway Horizon
                                    </h3>
                                </div>
                                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${runwayStatus.badgeColor}`}>
                                    {runwayStatus.label}
                                </span>
                            </div>

                            {/* Core Big Metric */}
                            <div className="mb-6">
                                <span className="text-[10px] uppercase font-mono tracking-widest text-[#1A1A1A]/50 block mb-1 font-bold">
                                    Survival Liquidity Buffer
                                </span>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-4xl sm:text-5xl font-editorial font-bold text-[#1A1A1A] leading-none">
                                        {runwayMonths}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-[#1A1A1A]/60 uppercase">
                                        Months of Liquid Runway
                                    </span>
                                </div>
                                <p className="text-xs text-[#1A1A1A]/70 font-sans-clean leading-relaxed">
                                    {currentVault === 0 
                                        ? "You haven't set aside emergency savings yet. Stashing a small amount helps cover surprise expenses."
                                        : totalExpense > 0 
                                            ? Number(runwayMonths) < 1
                                                ? `If your income stops today, your saved money will cover all your expenses for about ${Math.max(1, Math.round(Number(runwayMonths) * 30))} days (based on spending ${formatCurrency(totalExpense)}/month).`
                                                : `If your income stops today, your saved money will cover all your living expenses for ${runwayMonths} months without needing new income.`
                                            : "No expenses recorded this month. Your emergency savings remain completely untouched."}
                                </p>
                            </div>

                            {/* Vault Savings Target Progress */}
                            <div className="p-4 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm mb-4">
                                <div className="flex justify-between items-center text-xs font-mono mb-2">
                                    <span className="text-[#1A1A1A]/70">Vault Goal: {formatCurrency(targetVault)}</span>
                                    <span className="font-bold text-[#088fff]">{formatCurrency(currentVault)} ({vaultProgress}%)</span>
                                </div>
                                <div className="w-full h-2.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#088fff] to-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${vaultProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono text-[#1A1A1A]/50 mt-2">
                                    <span>Buffer: 3–6 Mo Benchmark</span>
                                    <span>Remaining: {formatCurrency(Math.max(0, targetVault - currentVault))}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer / Action */}
                        <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#1A1A1A]/50 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Zero Risk Liquid Reserves</span>
                            </span>
                            <button
                                onClick={() => navigate('/budget')}
                                className="text-[11px] uppercase tracking-widest font-bold text-[#088fff] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <span>Manage Vault Buffer</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Daily Safe-to-Spend & Cashflow Pacing */}
                    <div className="bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between">
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between pb-5 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#088fff]" />
                                    <h3 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                                        Daily Safe-to-Spend & Pacing
                                    </h3>
                                </div>
                                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                                    isPacingOptimal 
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80' 
                                        : 'text-amber-700 bg-amber-50 border-amber-200/80'
                                }`}>
                                    {isPacingOptimal ? 'Disciplined Pacing' : 'Elevated Outflows'}
                                </span>
                            </div>

                            {/* Core Big Metric */}
                            <div className="mb-6">
                                <span className="text-[10px] uppercase font-mono tracking-widest text-[#1A1A1A]/50 block mb-1 font-bold">
                                    Safe Daily Allowance
                                </span>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-4xl sm:text-5xl font-editorial font-bold text-emerald-600 leading-none">
                                        {formatCurrency(safeDailySpend)}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-[#1A1A1A]/60 uppercase">
                                        / Day Safe Spend
                                    </span>
                                </div>
                                <p className="text-xs text-[#1A1A1A]/70 font-sans-clean leading-relaxed">
                                    {netSavings > 0
                                        ? `You can safely spend up to ${formatCurrency(safeDailySpend)} each day for the remaining ${remainingDaysInMonth} days without touching your planned savings.`
                                        : "You have used all of this month's income. Try to keep daily expenses minimal until your next paycheck."}
                                </p>
                            </div>

                            {/* Calendar & Budget Velocity Comparison */}
                            <div className="p-4 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm mb-4 space-y-3">
                                {/* Timeline Progress */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                                        <span className="text-[#1A1A1A]/70 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                                            <span>Month Timeline (Day {currentDay} of {daysInCurrentMonth})</span>
                                        </span>
                                        <span className="font-bold text-[#1A1A1A]">{monthPercentElapsed}% Elapsed</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#1A1A1A] rounded-full transition-all duration-500"
                                            style={{ width: `${monthPercentElapsed}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Outflow Budget Progress */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                                        <span className="text-[#1A1A1A]/70 flex items-center gap-1.5">
                                            <Target className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                                            <span>Income Burn Rate ({formatCurrency(totalExpense)} / {formatCurrency(totalIncome)})</span>
                                        </span>
                                        <span className={`font-bold ${budgetUtilizedPercent > monthPercentElapsed ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {budgetUtilizedPercent}% Utilized
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                budgetUtilizedPercent > monthPercentElapsed ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${budgetUtilizedPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer / Action */}
                        <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                                <span>Surplus Protected: </span>
                                <strong className="text-emerald-700">{formatCurrency(Math.max(0, netSavings))}</strong>
                            </span>
                            <button
                                onClick={() => navigate('/budget')}
                                className="text-[11px] uppercase tracking-widest font-bold text-[#088fff] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <span>Calibrate Budget Caps</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Quick Add Log Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                        <div className="bg-[#1A1A1A] text-white border border-white/20 rounded-md p-6 max-w-md w-full shadow-2xl relative">
                            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-[#088fff]" />
                                    <h3 className="text-sm font-editorial font-bold text-white uppercase tracking-wider">
                                        Log Custom Entry
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTransaction} className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-mono text-white/60 block mb-1.5">
                                        Transaction Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewType('expense')}
                                            className={`py-2 text-xs font-mono font-bold rounded-sm border cursor-pointer transition-all ${
                                                newType === 'expense' 
                                                    ? 'bg-rose-600/90 text-white border-rose-500 shadow-sm' 
                                                    : 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10'
                                            }`}
                                        >
                                            Expense (-)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewType('income')}
                                            className={`py-2 text-xs font-mono font-bold rounded-sm border cursor-pointer transition-all ${
                                                newType === 'income' 
                                                    ? 'bg-emerald-600/90 text-white border-emerald-500 shadow-sm' 
                                                    : 'bg-white/5 text-white/60 border-white/15 hover:bg-white/10'
                                            }`}
                                        >
                                            Income (+)
                                        </button>
                                    </div>
                                </div>

                                {/* Prominent Hero Amount Input - Visually completely distinct */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-[10px] uppercase font-mono font-bold text-white/70">
                                            Amount ({symbol})
                                        </label>
                                        <span className={`text-[10px] font-mono font-bold ${
                                            newType === 'income' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                            {newType === 'income' ? '+ Inflow' : '- Outflow'}
                                        </span>
                                    </div>
                                    <div className={`relative flex items-center bg-[#111111] border rounded-sm p-1.5 transition-all ${
                                        newType === 'income' 
                                            ? 'border-emerald-500/40 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20' 
                                            : 'border-rose-500/40 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/20'
                                    }`}>
                                        <span className={`pl-2.5 pr-1.5 text-2xl font-mono font-bold select-none ${
                                            newType === 'income' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                            {symbol}
                                        </span>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="0"
                                            value={newAmount}
                                            onChange={(e) => setNewAmount(e.target.value)}
                                            className="w-full bg-transparent text-2xl font-mono font-bold text-white py-1 pr-2 focus:outline-none placeholder:text-white/20"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Description / Note Input */}
                                <div>
                                    <label className="text-[10px] uppercase font-mono text-white/60 block mb-1.5">
                                        Description / Payee (Where or Who)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. D-Mart Groceries, Salary Credit, Coffee with Team"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff] placeholder:text-white/30"
                                        required
                                    />
                                    {/* Smart Helper if user types numbers in Title field */}
                                    {/^\d+$/.test(newTitle.trim()) && (
                                        <div className="flex items-center justify-between mt-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-mono text-amber-300">
                                            <span>💡 "{newTitle.trim()}" looks like an amount. Want to move it to Amount?</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewAmount(newTitle.trim());
                                                    setNewTitle('');
                                                }}
                                                className="ml-2 px-2 py-0.5 bg-amber-500 text-black font-bold text-[10px] rounded hover:bg-amber-400 cursor-pointer shrink-0"
                                            >
                                                Move to Amount
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Category Selector */}
                                <div>
                                    <label className="text-[10px] uppercase font-mono text-white/60 block mb-1.5">
                                        Category
                                    </label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full bg-[#2A2A2A] border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff] cursor-pointer"
                                    >
                                        <option value="Groceries">Groceries</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Food">Food & Dining</option>
                                        <option value="Housing">Housing & Rent</option>
                                        <option value="Utilities">Utilities & Bills</option>
                                        <option value="Travel">Travel & Fuel</option>
                                        <option value="Subscription">Subscriptions</option>
                                        <option value="EMI & Loans">EMI & Loans</option>
                                        <option value="Health">Health & Medical</option>
                                        <option value="Entertainment">Entertainment</option>
                                        <option value="Education">Education</option>
                                        <option value="Income">Income / Salary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-xs text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-sm cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-xs font-bold text-white bg-[#088fff] hover:bg-[#088fff]/80 rounded-sm cursor-pointer"
                                    >
                                        Post Entry
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* AI Health Index Breakdown & Tier Guide Modal */}
                <HealthScoreModal
                    isOpen={showHealthModal}
                    onClose={() => setShowHealthModal(false)}
                    summary={summary}
                    vault={vault}
                    runwayMonths={runwayMonths}
                />

                {/* Confirm Delete Transaction Modal */}
                <ConfirmDeleteModal
                    isOpen={Boolean(pendingDeleteTx)}
                    onClose={() => setPendingDeleteTx(null)}
                    onConfirm={() => {
                        if (pendingDeleteTx) {
                            handleDeleteTx(pendingDeleteTx.id);
                            setPendingDeleteTx(null);
                        }
                    }}
                    title="Delete Transaction?"
                    itemName={pendingDeleteTx?.title}
                    itemDetails={pendingDeleteTx ? `${formatCurrency(pendingDeleteTx.amount)} • ${pendingDeleteTx.category} (${pendingDeleteTx.type === 'income' ? 'Income' : 'Expense'})` : ''}
                    message="Are you sure you want to delete this recorded transaction? This will permanently update your cashflow and balances."
                    confirmText="Delete Entry"
                />
            </div>
        </section>
    );
};

export default DashboardSection;
