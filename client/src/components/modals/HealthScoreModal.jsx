import React from 'react';
import { 
    X, 
    ShieldCheck, 
    Activity, 
    TrendingUp, 
    Wallet, 
    Sparkles, 
    CheckCircle2, 
    AlertTriangle, 
    HelpCircle,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { formatCurrency, useCurrency } from '../../utils/formatCurrency';

/**
 * Standard Industry Score Tiers Reference
 */
export const HEALTH_TIERS = [
    {
        key: 'excellent',
        min: 85,
        max: 100,
        label: 'Excellent',
        tierName: 'Optimal Tier',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        barColor: '#10b981',
        dotColor: 'bg-emerald-500',
        description: 'Superb financial discipline. Consistent savings (>25%), controlled expenses, and a healthy emergency runway.'
    },
    {
        key: 'good',
        min: 70,
        max: 84,
        label: 'Good',
        tierName: 'Healthy Tier',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
        barColor: '#088fff',
        dotColor: 'bg-[#088fff]',
        description: 'Solid cashflow and steady savings. Expenses are under control with a growing safety buffer.'
    },
    {
        key: 'moderate',
        min: 50,
        max: 69,
        label: 'Moderate',
        tierName: 'Fair Tier',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
        barColor: '#f59e0b',
        dotColor: 'bg-amber-500',
        description: 'Balanced but tight. Living expenses consume most earnings, leaving modest surplus for emergency savings.'
    },
    {
        key: 'below_average',
        min: 30,
        max: 49,
        label: 'Below Average',
        tierName: 'At-Risk Tier',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-300',
        barColor: '#f97316',
        dotColor: 'bg-orange-500',
        description: 'High expense ratio. Over 80% of income is spent, creating vulnerability to sudden unexpected costs.'
    },
    {
        key: 'critical',
        min: 0,
        max: 29,
        label: 'Critical',
        tierName: 'Urgent Action Tier',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
        barColor: '#ef4444',
        dotColor: 'bg-rose-500',
        description: 'Expenses exceed income or emergency reserves are empty. Immediate expense reduction recommended.'
    }
];

/**
 * Centrally computes the 3-pillar breakdown and overall health score
 */
export const calculateHealthBreakdown = (summary = {}, vault = {}, runwayMonths = 0, emiInput = null) => {
    const totalIncome = Number(summary?.totalIncome || 0);
    const totalExpense = Number(summary?.totalExpense || 0);
    const netSavings = Number(summary?.netSavings || 0);
    const currentVault = Number(vault?.current || 0);
    const numericRunway = Number(runwayMonths) || 0;

    // Calculate monthly debt/EMI burden from parameter or localStorage
    let totalMonthlyEmi = 0;
    if (typeof emiInput === 'number') {
        totalMonthlyEmi = emiInput;
    } else if (Array.isArray(emiInput)) {
        totalMonthlyEmi = emiInput.reduce((acc, c) => acc + (Number(c.numericAmount) || 0), 0);
    } else {
        try {
            const saved = localStorage.getItem('bb_user_emi_cards');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    totalMonthlyEmi = parsed.reduce((acc, c) => acc + (Number(c.numericAmount) || 0), 0);
                }
            }
        } catch {
            // fallback
        }
    }

    // Pillar 1: Savings Rate (Max 30 points)
    // Benchmark: 25%+ savings rate awards full 30 points.
    let savingsRatePoints = 0;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    if (totalIncome === 0 && totalExpense === 0) {
        savingsRatePoints = 22; // Default baseline for clean onboarding
    } else if (savingsRate >= 25) {
        savingsRatePoints = 30;
    } else if (savingsRate > 0) {
        savingsRatePoints = Math.round((savingsRate / 25) * 30);
    } else {
        savingsRatePoints = 0;
    }

    // Pillar 2: Spending Control & Burn Ratio (Max 25 points)
    // Benchmark: Expenses <= 50% of income awards full 25 points.
    let spendingControlPoints = 0;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 0);
    if (totalIncome === 0 && totalExpense === 0) {
        spendingControlPoints = 20;
    } else if (expenseRatio <= 50) {
        spendingControlPoints = 25;
    } else if (expenseRatio <= 75) {
        spendingControlPoints = Math.round(25 - ((expenseRatio - 50) / 25) * 12);
    } else if (expenseRatio <= 100) {
        spendingControlPoints = Math.max(4, Math.round(13 - ((expenseRatio - 75) / 25) * 9));
    } else {
        spendingControlPoints = 0; // Negative cashflow
    }

    // Pillar 3: Emergency Runway & Buffer (Max 25 points)
    // Benchmark: 3 to 6 months of living expenses saved in vault.
    let runwayPoints = 0;
    if (numericRunway >= 3 || (totalExpense === 0 && currentVault > 0)) {
        runwayPoints = 25;
    } else if (numericRunway >= 1) {
        runwayPoints = Math.round(12 + ((numericRunway - 1) / 2) * 13);
    } else if (currentVault > 0) {
        runwayPoints = Math.max(5, Math.round(numericRunway * 12));
    } else {
        runwayPoints = 0; // Unfunded vault
    }

    // Pillar 4: Debt Burden & EMI Health (Max 20 points)
    // Benchmark: DTI <= 15% awards 20 pts; <= 30% awards 15-19 pts; <= 45% awards 8-14 pts.
    let debtPoints = 0;
    const dtiRatio = totalIncome > 0 ? (totalMonthlyEmi / totalIncome) * 100 : 0;
    if (totalIncome === 0 && totalMonthlyEmi === 0) {
        debtPoints = 18; // Clean onboarding baseline with zero debt
    } else if (totalMonthlyEmi === 0) {
        debtPoints = 20; // Zero debt with active earnings
    } else if (dtiRatio <= 15) {
        debtPoints = 20; // Prime low-debt leverage
    } else if (dtiRatio <= 30) {
        debtPoints = Math.round(20 - ((dtiRatio - 15) / 15) * 5); // 15 to 20 pts
    } else if (dtiRatio <= 50) {
        debtPoints = Math.max(5, Math.round(15 - ((dtiRatio - 30) / 20) * 10)); // 5 to 15 pts
    } else {
        debtPoints = Math.max(1, Math.round(5 - ((dtiRatio - 50) / 50) * 4)); // 1 to 5 pts
    }

    const totalScore = Math.min(99, Math.max(10, savingsRatePoints + spendingControlPoints + runwayPoints + debtPoints));

    const currentTier = HEALTH_TIERS.find(t => totalScore >= t.min && totalScore <= t.max) || HEALTH_TIERS[2];

    return {
        totalScore,
        currentTier,
        pillars: {
            savings: {
                points: savingsRatePoints,
                max: 30,
                percentage: Math.round((savingsRatePoints / 30) * 100),
                label: 'Savings Retention',
                valueDisplay: totalIncome > 0 ? `${savingsRate.toFixed(1)}% Saved` : 'Awaiting Income Log',
                ruleText: 'Evaluates what percentage of earnings is retained after expenses. Saving 25%+ earns full 30 pts.'
            },
            spending: {
                points: spendingControlPoints,
                max: 25,
                percentage: Math.round((spendingControlPoints / 25) * 100),
                label: 'Spending Discipline',
                valueDisplay: totalIncome > 0 ? `${expenseRatio.toFixed(1)}% Spent` : 'Zero Expenses',
                ruleText: 'Measures how well living costs fit within income. Spending under 50% earns the full 25 pts.'
            },
            runway: {
                points: runwayPoints,
                max: 25,
                percentage: Math.round((runwayPoints / 25) * 100),
                label: 'Emergency Safety Buffer',
                valueDisplay: currentVault > 0 ? `${numericRunway > 0 ? numericRunway + ' Mos' : 'Vault Active'}` : 'Vault Unfunded',
                ruleText: 'Assesses how many months of expenses your vault covers without income. 3–6 months gives maximum resilience (25 pts).'
            },
            debt: {
                points: debtPoints,
                max: 20,
                percentage: Math.round((debtPoints / 20) * 100),
                label: 'Debt & EMI Load (DTI)',
                valueDisplay: totalIncome > 0 
                    ? `${dtiRatio.toFixed(1)}% DTI (${formatCurrency(totalMonthlyEmi)}/mo)` 
                    : (totalMonthlyEmi > 0 ? `${formatCurrency(totalMonthlyEmi)}/mo Debt` : 'Zero Debt Obligations'),
                ruleText: 'Evaluates monthly EMI obligations against earnings. Keeping DTI under 20-30% preserves prime credit score (20 pts).'
            }
        }
    };
};

export const HealthScoreModal = ({ isOpen, onClose, summary = {}, vault = {}, runwayMonths = 0, emiCards = null }) => {
    const { formatCurrency: fmtCurr } = useCurrency();
    if (!isOpen) return null;

    const breakdown = calculateHealthBreakdown(summary, vault, runwayMonths, emiCards);
    const { totalScore, currentTier, pillars } = breakdown;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div 
                className="bg-white text-[#1A1A1A] w-full max-w-4xl lg:max-w-5xl rounded-sm shadow-2xl border border-[#1A1A1A]/20 relative my-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[#1A1A1A]/10 bg-[#F9F8F5]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#088fff]/10 flex items-center justify-center text-[#088fff] border border-[#088fff]/20">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-editorial font-bold text-[#1A1A1A] tracking-tight">
                                AI Financial Health Index
                            </h3>
                            <span className="text-[10px] text-[#1A1A1A]/60 font-mono uppercase tracking-wider block">
                                Transparent 4-Pillar Scoring Engine & Tier Guide
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] p-1.5 rounded-sm hover:bg-[#1A1A1A]/5 transition-colors cursor-pointer"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                    {/* Current Score Spotlight Banner */}
                    <div className="p-5 bg-[#1A1A1A] text-white rounded-sm border border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-[#088fff]">
                                <span className="text-2xl font-editorial font-bold text-white">
                                    {totalScore}
                                </span>
                                <span className="absolute -bottom-2 text-[9px] font-mono bg-[#088fff] text-white px-1.5 rounded-full font-bold">
                                    /100
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono uppercase text-white/50 tracking-wider">
                                        Your Standing:
                                    </span>
                                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${currentTier.badgeClass}`}>
                                        {currentTier.label.toUpperCase()} ({currentTier.tierName})
                                    </span>
                                </div>
                                <p className="text-xs text-white/80 font-sans-clean leading-relaxed max-w-sm">
                                    {currentTier.description}
                                </p>
                            </div>
                        </div>

                        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                            <span className="text-[10px] font-mono uppercase text-white/40 block">Net Worth</span>
                            <span className="text-lg font-editorial font-bold text-[#088fff]">
                                {fmtCurr(Number(summary?.netWorth || 0))}
                            </span>
                        </div>
                    </div>

                    {/* How It Is Calculated: 4 Pillars */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#088fff]" />
                                <span>How Your Score Is Calculated</span>
                            </h4>
                            <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                                4 Independent Weight Factors (Total: 100 Pts)
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Pillar 1: Savings */}
                            <div className="p-3.5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/60">
                                            1. Savings Rate
                                        </span>
                                        <span className="text-xs font-mono font-bold text-[#088fff]">
                                            {pillars.savings.points} / {pillars.savings.max}
                                        </span>
                                    </div>
                                    <div className="text-sm font-editorial font-bold text-[#1A1A1A] mb-1">
                                        {pillars.savings.valueDisplay}
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className="h-full bg-[#088fff] rounded-full transition-all duration-300" 
                                            style={{ width: `${pillars.savings.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#1A1A1A]/60 font-sans-clean leading-normal">
                                    {pillars.savings.ruleText}
                                </p>
                            </div>

                            {/* Pillar 2: Spending Control */}
                            <div className="p-3.5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/60">
                                            2. Spending Control
                                        </span>
                                        <span className="text-xs font-mono font-bold text-emerald-600">
                                            {pillars.spending.points} / {pillars.spending.max}
                                        </span>
                                    </div>
                                    <div className="text-sm font-editorial font-bold text-[#1A1A1A] mb-1">
                                        {pillars.spending.valueDisplay}
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                                            style={{ width: `${pillars.spending.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#1A1A1A]/60 font-sans-clean leading-normal">
                                    {pillars.spending.ruleText}
                                </p>
                            </div>

                            {/* Pillar 3: Emergency Runway */}
                            <div className="p-3.5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/60">
                                            3. Emergency Buffer
                                        </span>
                                        <span className="text-xs font-mono font-bold text-purple-600">
                                            {pillars.runway.points} / {pillars.runway.max}
                                        </span>
                                    </div>
                                    <div className="text-sm font-editorial font-bold text-[#1A1A1A] mb-1">
                                        {pillars.runway.valueDisplay}
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className="h-full bg-purple-500 rounded-full transition-all duration-300" 
                                            style={{ width: `${pillars.runway.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#1A1A1A]/60 font-sans-clean leading-normal">
                                    {pillars.runway.ruleText}
                                </p>
                            </div>

                            {/* Pillar 4: Debt & EMI Load */}
                            <div className="p-3.5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/60">
                                            4. Debt & EMI Load
                                        </span>
                                        <span className="text-xs font-mono font-bold text-amber-600">
                                            {pillars.debt.points} / {pillars.debt.max}
                                        </span>
                                    </div>
                                    <div className="text-sm font-editorial font-bold text-[#1A1A1A] mb-1">
                                        {pillars.debt.valueDisplay}
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                                            style={{ width: `${pillars.debt.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#1A1A1A]/60 font-sans-clean leading-normal">
                                    {pillars.debt.ruleText}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Standard Industry Tiers Reference Table */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#088fff]" />
                                <span>Industry Health Score Tier Guide</span>
                            </h4>
                            <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                                Benchmarked against Consumer Finance Standards
                            </span>
                        </div>

                        <div className="border border-[#1A1A1A]/15 rounded-sm overflow-hidden divide-y divide-[#1A1A1A]/10">
                            {HEALTH_TIERS.map((tier) => {
                                const isCurrent = currentTier.key === tier.key;
                                return (
                                    <div 
                                        key={tier.key}
                                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                            isCurrent ? 'bg-[#088fff]/5 border-l-4 border-l-[#088fff]' : 'bg-white hover:bg-[#F9F8F5]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span 
                                                className="w-3 h-3 rounded-full shrink-0" 
                                                style={{ backgroundColor: tier.barColor }}
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold font-editorial text-[#1A1A1A]">
                                                        {tier.label}
                                                    </span>
                                                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${tier.badgeClass}`}>
                                                        {tier.min} – {tier.max} pts
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="text-[9px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                            Your Current Level
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#1A1A1A]/70 font-sans-clean mt-0.5">
                                                    {tier.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* How to Improve Tip Box */}
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-sm flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs font-sans-clean text-emerald-900 leading-relaxed">
                            <span className="font-bold block mb-0.5">How to boost your score:</span>
                            Maintain your savings rate above 20%, keep your monthly burn below 60% of earnings, and allocate a small portion of savings to your Emergency Vault every month.
                        </div>
                    </div>
                </div>

                {/* Footer Close Button */}
                <div className="px-6 py-3.5 border-t border-[#1A1A1A]/10 bg-[#F9F8F5] flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-2.5 px-6 rounded-sm transition-colors cursor-pointer shadow-sm"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HealthScoreModal;
