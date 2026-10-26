import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useCurrency, formatCurrency, formatCompact } from '../../utils/formatCurrency';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { 
  calculateFinancialTelemetry, 
  getUserTransactions, 
  getUserVault, 
  getUserLiabilitiesSummary, 
  normalizeCategoryName, 
  syncAllFromBackend 
} from '../../services/userDataService';
import { calculateHealthBreakdown } from '../../components/modals/HealthScoreModal';

const CATEGORY_COLORS = [
  '#088fff', // Electric Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#64748b'  // Slate
];

// Helper to extract 'YYYY-MM' from transaction date
const getTxYearMonth = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    return `${year}-${month}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return null;
};

// Helper to format 'YYYY-MM' to readable short label e.g. 'Oct 26'
const formatYearMonthLabel = (yearMonth) => {
  if (!yearMonth) return '';
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const shortYear = String(year).slice(-2);
  return `${monthNames[monthIdx] || ''} ${shortYear}`;
};

// Generate contiguous calendar months between start 'YYYY-MM' and end 'YYYY-MM'
const getMonthRange = (startKey, endKey) => {
  if (!startKey || !endKey) return [];
  const [startYear, startMonth] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);
  
  const results = [];
  let curYear = startYear;
  let curMonth = startMonth;

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    results.push(`${curYear}-${String(curMonth).padStart(2, '0')}`);
    curMonth++;
    if (curMonth > 12) {
      curMonth = 1;
      curYear++;
    }
  }
  return results;
};

// Custom Tooltip for Cash Flow Chart
const CustomCashFlowTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A1A] text-white p-3.5 rounded-sm shadow-xl border border-white/10 font-sans-clean text-xs">
        <p className="font-mono uppercase font-bold text-white/60 mb-2 pb-1 border-b border-white/10">
          Period: {label}
        </p>
        <div className="space-y-1.5 font-mono">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-white/80">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
                {formatCurrency(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Category Donut Chart
const CustomCategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#1A1A1A] text-white p-3 rounded-sm shadow-xl border border-white/10 font-sans-clean text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="font-bold text-white uppercase font-mono">{data.name}</span>
        </div>
        <div className="font-mono text-emerald-400 font-bold text-sm">
          {formatCurrency(Number(data.value))}
        </div>
        <span className="text-[10px] text-white/60 font-mono">
          {data.payload.percent}% of total expenses
        </span>
      </div>
    );
  }
  return null;
};

export const AnalyticsPage = () => {
  const { symbol, formatCurrency: fmtCurr, formatCompact: fmtCompact } = useCurrency();
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('6M');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(null);

  const [telemetry, setTelemetry] = useState(() => calculateFinancialTelemetry());
  const [transactions, setTransactions] = useState(() => getUserTransactions());
  const [vault, setVault] = useState(() => getUserVault());
  const [liabilities, setLiabilities] = useState(() => getUserLiabilitiesSummary());

  useEffect(() => {
    syncAllFromBackend();

    const handleSync = () => {
      setTelemetry(calculateFinancialTelemetry());
      setTransactions(getUserTransactions());
      setVault(getUserVault());
      setLiabilities(getUserLiabilitiesSummary());
    };

    window.addEventListener('userDataChanged', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('userDataChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const { summary } = telemetry;
  const currentIncome = Number(summary?.totalIncome || 0);
  const currentExpense = Number(summary?.totalExpense || 0);

  // Dynamic Multi-Month Cash Flow Data strictly from real user transactions
  // If user has no previous months (joined this month), shows only this month
  const dynamicCashFlowData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Extract valid months from existing user transactions
    const validTxMonthKeys = transactions
      .map(tx => getTxYearMonth(tx.date))
      .filter(Boolean)
      .sort();

    // If no transactions exist, show only the current month with zero values
    if (validTxMonthKeys.length === 0) {
      return [{
        key: currentMonthKey,
        month: formatYearMonthLabel(currentMonthKey),
        income: 0,
        expense: 0,
        netCashflow: 0,
        savingsRate: 0
      }];
    }

    const earliestKey = validTxMonthKeys[0];
    const latestKey = validTxMonthKeys[validTxMonthKeys.length - 1] > currentMonthKey 
      ? validTxMonthKeys[validTxMonthKeys.length - 1] 
      : currentMonthKey;

    // Generate only contiguous months from user's earliest transaction to now
    // Never manufacture fake historical months prior to when the user joined
    const allMonthsInRange = getMonthRange(earliestKey, latestKey);

    // Group actual transactions by month
    const monthlyMap = {};
    allMonthsInRange.forEach(key => {
      monthlyMap[key] = { income: 0, expense: 0 };
    });

    transactions.forEach(t => {
      const key = getTxYearMonth(t.date);
      if (key && monthlyMap[key]) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          monthlyMap[key].income += amt;
        } else if (t.type === 'expense') {
          monthlyMap[key].expense += amt;
        }
      }
    });

    const assembled = allMonthsInRange.map(key => {
      const data = monthlyMap[key];
      const income = Math.round(data.income);
      const expense = Math.round(data.expense);
      const netCashflow = Math.max(0, income - expense);
      const savingsRate = income > 0 ? Number(((income - expense) / income * 100).toFixed(1)) : 0;
      return {
        key,
        month: formatYearMonthLabel(key),
        income,
        expense,
        netCashflow,
        savingsRate
      };
    });

    // Timeframe slice: limit to at most 1, 3, 6, 12 months, but NEVER prepend fake months!
    if (timeframe === '1M') return assembled.slice(-1);
    if (timeframe === '3M') return assembled.slice(-3);
    if (timeframe === '6M') return assembled.slice(-6);
    if (timeframe === '1Y') return assembled.slice(-12);
    return assembled;
  }, [transactions, timeframe]);

  // Aggregate timeframe KPIs from real cashflow
  const periodIncome = useMemo(() => dynamicCashFlowData.reduce((sum, d) => sum + d.income, 0), [dynamicCashFlowData]);
  const periodExpense = useMemo(() => dynamicCashFlowData.reduce((sum, d) => sum + d.expense, 0), [dynamicCashFlowData]);
  const periodNetSavings = periodIncome - periodExpense;
  const periodSavingsRate = periodIncome > 0 ? Number(((periodNetSavings / periodIncome) * 100).toFixed(1)) : 0;

  // Donut category spending data filtered strictly by active timeframe months
  const donutData = useMemo(() => {
    const activeKeys = new Set(dynamicCashFlowData.map(d => d.key));
    const relevantExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const ym = getTxYearMonth(t.date);
      return ym && activeKeys.has(ym);
    });

    const categoryMap = {};
    let totalSpent = 0;
    relevantExpenses.forEach(t => {
      const cat = normalizeCategoryName(t.category || 'Other');
      const amt = Number(t.amount) || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      totalSpent += amt;
    });

    const cats = Object.keys(categoryMap);
    if (cats.length === 0 || totalSpent === 0) {
      return [{ name: 'No Expenses Logged', value: 1, percent: 100, color: '#94a3b8', isEmpty: true }];
    }

    // Sort categories in descending order of spend (highest to lowest)
    const sortedCats = cats
      .map(catName => ({
        name: catName,
        value: categoryMap[catName],
        percent: totalSpent > 0 ? Number(((categoryMap[catName] / totalSpent) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value);

    return sortedCats.map((cat, idx) => ({
      ...cat,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
    }));
  }, [dynamicCashFlowData, transactions]);

  // Cumulative Wealth Growth Area Data from real user vault and real monthly surplus
  const cumulativeGrowthData = useMemo(() => {
    let runningNetWorth = Number(vault?.current || 0);
    return dynamicCashFlowData.map(item => {
      runningNetWorth += Math.max(0, item.netCashflow);
      return {
        month: item.month,
        estimatedNetWorth: runningNetWorth,
        monthlySurplus: item.netCashflow
      };
    });
  }, [dynamicCashFlowData, vault?.current]);

  // 50/30/20 Framework Compliance computed strictly from active timeframe transactions
  const timeframeRule503020 = useMemo(() => {
    const activeKeys = new Set(dynamicCashFlowData.map(d => d.key));
    const activeTxs = transactions.filter(t => {
      const ym = getTxYearMonth(t.date);
      return ym && activeKeys.has(ym);
    });

    const activeIncome = activeTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const NEEDS_CATEGORIES = new Set(['Housing', 'Groceries', 'Utilities', 'Health', 'EMI & Loans', 'Education']);
    let needsAmt = 0;
    let wantsAmt = 0;

    activeTxs.filter(t => t.type === 'expense').forEach(t => {
      const cat = normalizeCategoryName(t.category || 'Other');
      const amt = Number(t.amount) || 0;
      if (NEEDS_CATEGORIES.has(cat)) {
        needsAmt += amt;
      } else {
        wantsAmt += amt;
      }
    });

    const needsPct = activeIncome > 0 ? Math.min(100, Math.round((needsAmt / activeIncome) * 100)) : 0;
    const wantsPct = activeIncome > 0 ? Math.min(100, Math.round((wantsAmt / activeIncome) * 100)) : 0;
    const savingsAmt = Math.max(0, activeIncome - (needsAmt + wantsAmt));
    const savingsPct = activeIncome > 0 ? Math.min(100, Math.round((savingsAmt / activeIncome) * 100)) : 0;

    const needsCap = Math.round(activeIncome * 0.50);
    const wantsCap = Math.round(activeIncome * 0.30);
    const savingsTarget = Math.round(activeIncome * 0.20);

    return {
      income: activeIncome,
      needs: { 
        target: 50, 
        actual: needsPct,
        spent: needsAmt,
        cap: needsCap
      },
      wants: { 
        target: 30, 
        actual: wantsPct,
        spent: wantsAmt,
        cap: wantsCap
      },
      savings: { 
        target: 20, 
        actual: savingsPct,
        saved: savingsAmt,
        targetAmount: savingsTarget
      }
    };
  }, [dynamicCashFlowData, transactions]);

  // Financial Health Breakdown computed centrally using real user data & liabilities
  const currentExpenseBurn = periodExpense > 0 ? (periodExpense / Math.max(1, dynamicCashFlowData.length)) : (currentExpense || 0);
  const runwayMonths = currentExpenseBurn > 0 
    ? (Number(vault?.current || 0) / currentExpenseBurn).toFixed(1) 
    : (Number(vault?.current || 0) > 0 ? 6 : 0);

  const healthScoreData = useMemo(() => {
    return calculateHealthBreakdown(
      { totalIncome: periodIncome, totalExpense: periodExpense, netSavings: periodNetSavings },
      vault,
      runwayMonths,
      liabilities
    );
  }, [periodIncome, periodExpense, periodNetSavings, vault, runwayMonths, liabilities]);

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-[#1A1A1A]/10 gap-6 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              REAL-TIME ANALYTICAL TELEMETRY & INTEL
            </span>
            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              FINANCIAL <span className="italic text-[#088fff]">ANALYTICS</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#1A1A1A]/70 max-w-2xl font-light">
              Interactive multi-dimensional financial intelligence: cash flow trajectory, category spending distribution, cumulative wealth velocity, and 50/30/20 framework compliance.
            </p>
          </div>

          {/* Timeframe Filter Pills */}
          <div className="flex items-center gap-1.5 bg-white border border-[#1A1A1A]/15 p-1 rounded-sm shadow-sm">
            {['1M', '3M', '6M', '1Y'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3.5 py-1.5 text-xs font-bold font-mono rounded-sm transition-all cursor-pointer ${
                  timeframe === tf 
                    ? 'bg-[#1A1A1A] text-white shadow-xs' 
                    : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-gray-100'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Top KPI Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50 block mb-1">
              TOTAL RECORDED INCOME
            </span>
            <div className="text-3xl font-editorial font-bold text-[#088fff]">
              {fmtCurr(periodIncome)}
            </div>
            <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{dynamicCashFlowData.length === 1 ? 'Primary Inflow Verified' : 'Cumulative Period Inflow'}</span>
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50 block mb-1">
              TOTAL RECORDED EXPENSES
            </span>
            <div className="text-3xl font-editorial font-bold text-[#1A1A1A]">
              {fmtCurr(periodExpense)}
            </div>
            <span className="text-[10px] font-mono text-[#1A1A1A]/60 mt-1 block">
              Burn rate: {periodIncome > 0 ? ((periodExpense / periodIncome) * 100).toFixed(1) : 0}% of income
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50 block mb-1">
              NET CASHFLOW SURPLUS
            </span>
            <div className={`text-3xl font-editorial font-bold ${periodNetSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {periodNetSavings >= 0 ? '+' : '-'}{fmtCurr(Math.abs(periodNetSavings))}
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block mt-1">
              Savings Rate: {periodSavingsRate}%
            </span>
          </div>

          <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50 block mb-1">
              FINANCIAL HEALTH SCORE
            </span>
            <div className="text-3xl font-editorial font-bold text-[#1A1A1A] flex items-baseline gap-1">
              <span>{healthScoreData.totalScore}</span>
              <span className="text-xs font-mono font-normal text-[#1A1A1A]/50">/ 100</span>
            </div>
            <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded inline-block mt-1 ${healthScoreData.currentTier.badgeClass}`}>
              Grade: {healthScoreData.currentTier.label} ({healthScoreData.currentTier.tierName})
            </span>
          </div>
        </div>

        {/* PRIMARY CHARTS ROW: DUAL-SERIES CASH FLOW (LEFT) & DONUT BREAKDOWN (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-stretch">
          
          {/* CHART 1: RECHARTS DUAL-SERIES CASH FLOW TRAJECTORY */}
          <div className="lg:col-span-8 bg-white p-7 rounded-sm border border-[#1A1A1A]/15 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6 gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#088fff]" />
                  <h2 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                    Cash Flow Trajectory (Income vs Expense)
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#088fff]"></span>
                    <span>Income</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#1A1A1A]"></span>
                    <span>Expense</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Net Surplus</span>
                  </span>
                </div>
              </div>

              {/* Interactive Recharts Canvas */}
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dynamicCashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }} 
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => fmtCompact(val)}
                    />
                    <Tooltip content={<CustomCashFlowTooltip />} />
                    <Bar 
                      dataKey="income" 
                      name="Monthly Income" 
                      fill="#088fff" 
                      radius={[3, 3, 0, 0]} 
                      barSize={dynamicCashFlowData.length === 1 ? 40 : dynamicCashFlowData.length <= 3 ? 28 : 20}
                    />
                    <Bar 
                      dataKey="expense" 
                      name="Monthly Expense" 
                      fill="#1A1A1A" 
                      radius={[3, 3, 0, 0]} 
                      barSize={dynamicCashFlowData.length === 1 ? 40 : dynamicCashFlowData.length <= 3 ? 28 : 20}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netCashflow" 
                      name="Net Surplus" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#10b981' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A1A1A]/10 flex flex-wrap items-center justify-between text-xs font-mono text-[#1A1A1A]/70 gap-2">
              <span>Telemetry: {dynamicCashFlowData.length} {dynamicCashFlowData.length === 1 ? 'Month' : 'Months'} Logged</span>
              <span>Average Savings Horizon: <strong className="text-emerald-600 font-bold">{periodSavingsRate}%</strong></span>
            </div>
          </div>

          {/* CHART 2: RECHARTS CATEGORY EXPENSE DONUT */}
          <div className="lg:col-span-4 bg-white p-7 rounded-sm border border-[#1A1A1A]/15 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-[#088fff]" />
                  <h2 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                    Expense Breakdown
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase">Share %</span>
              </div>

              {/* Donut Chart with Center Net Spend Metric */}
              <div className="relative w-full h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    >
                      {donutData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="transition-all cursor-pointer hover:opacity-90"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomCategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[8px] font-mono uppercase tracking-wider text-[#1A1A1A]/50 font-bold">
                    TOTAL SPENT
                  </span>
                  <span className="text-base font-editorial font-bold text-[#1A1A1A] leading-tight">
                    {fmtCurr(periodExpense)}
                  </span>
                </div>
              </div>

              {/* Category Legend List */}
              <div className="mt-5 space-y-1.5 max-h-72 overflow-y-auto pr-2 pt-1 pb-1 [scrollbar-width:thin]">
                {donutData[0]?.isEmpty ? (
                  <div className="text-xs text-[#1A1A1A]/50 py-6 text-center font-mono">
                    No expenses logged in this timeframe
                  </div>
                ) : (
                  donutData.map((cat, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-sm transition-colors ${
                        activeCategoryIndex === idx ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-[#1A1A1A] font-medium truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono shrink-0">
                        <span className="text-[#1A1A1A]/70 font-semibold">{fmtCurr(Number(cat.value))}</span>
                        <span className="font-bold text-[#1A1A1A] w-12 text-right">{cat.percent}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A1A1A]/10 text-right">
              <span className="text-[10px] font-mono text-[#088fff] font-bold">
                {donutData[0]?.isEmpty ? '0 Categories Active' : `${donutData.length} Categories Active`}
              </span>
            </div>
          </div>
        </div>

        {/* SECOND ROW: CUMULATIVE WEALTH HORIZON & 50/30/20 ALLOCATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-stretch">
          
          {/* CHART 3: CUMULATIVE WEALTH GROWTH (AREA CHART) */}
          <div className="lg:col-span-7 bg-white p-7 rounded-sm border border-[#1A1A1A]/15 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                    Cumulative Net Worth Accumulation
                  </h2>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {dynamicCashFlowData.length === 1 ? 'Initial Horizon' : 'Positive Trajectory'}
                </span>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#088fff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#088fff" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => fmtCompact(val)}
                    />
                    <Tooltip 
                      formatter={(val) => [fmtCurr(Number(val)), 'Estimated Net Worth']}
                      labelStyle={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#ffffff', borderRadius: '4px', border: '1px solid #333' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="estimatedNetWorth" 
                      stroke="#088fff" 
                      strokeWidth={2.5}
                      dot={dynamicCashFlowData.length === 1 ? { r: 5, fill: '#088fff', strokeWidth: 2, stroke: '#ffffff' } : false}
                      fillOpacity={1} 
                      fill="url(#wealthGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-mono text-[#1A1A1A]/70">
              <span>Emergency Vault Reserves: <strong>{fmtCurr(Number(vault?.current || 0))}</strong></span>
              <span className="text-[#088fff] font-bold">Compound Growth Horizon</span>
            </div>
          </div>

          {/* 50/30/20 WEALTH RATIO COMPLIANCE */}
          <div className="lg:col-span-5 bg-[#1A1A1A] text-white p-7 rounded-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#088fff]" />
                  <h3 className="text-lg font-editorial font-bold text-white">
                    50/30/20 Framework Compliance
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  Audited
                </span>
              </div>

              <div className="space-y-6">
                {/* Needs: Target 50% */}
                <div>
                  <div className="flex justify-between items-baseline text-xs font-mono mb-2">
                    <span className="text-white/80">Needs (Fixed Essentials, Rent, EMIs)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/50">
                        {fmtCurr(timeframeRule503020.needs.spent)} / {fmtCurr(timeframeRule503020.needs.cap)}
                      </span>
                      <span className="font-bold text-[#088fff]">
                        {timeframeRule503020.needs.actual}% <span className="text-white/40 font-normal">/ 50%</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, timeframeRule503020.needs.actual)}%` }} 
                      className="h-full bg-[#088fff] rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/50 mt-1 block">
                    {timeframeRule503020.income > 0 ? (
                      timeframeRule503020.needs.actual <= 50 
                        ? `✓ ${fmtCurr(timeframeRule503020.needs.cap - timeframeRule503020.needs.spent)} headroom within 50% cap`
                        : `⚠️ Exceeding 50% cap by ${fmtCurr(timeframeRule503020.needs.spent - timeframeRule503020.needs.cap)}`
                    ) : (
                      timeframeRule503020.needs.actual <= 50 ? '✓ Well within recommended 50% ceiling' : '⚠️ Exceeding 50% threshold'
                    )}
                  </span>
                </div>

                {/* Wants: Target 30% */}
                <div>
                  <div className="flex justify-between items-baseline text-xs font-mono mb-2">
                    <span className="text-white/80">Wants (Dining, Leisure, Subscriptions)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/50">
                        {fmtCurr(timeframeRule503020.wants.spent)} / {fmtCurr(timeframeRule503020.wants.cap)}
                      </span>
                      <span className="font-bold text-amber-400">
                        {timeframeRule503020.wants.actual}% <span className="text-white/40 font-normal">/ 30%</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, timeframeRule503020.wants.actual)}%` }} 
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/50 mt-1 block">
                    {timeframeRule503020.income > 0 ? (
                      timeframeRule503020.wants.actual <= 30
                        ? `✓ ${fmtCurr(timeframeRule503020.wants.cap - timeframeRule503020.wants.spent)} headroom within 30% cap`
                        : `⚠️ Exceeding 30% cap by ${fmtCurr(timeframeRule503020.wants.spent - timeframeRule503020.wants.cap)}`
                    ) : (
                      timeframeRule503020.wants.actual <= 30 ? '✓ Controlled discretionary burn rate' : '⚠️ High discretionary spend'
                    )}
                  </span>
                </div>

                {/* Savings: Target 20% */}
                <div>
                  <div className="flex justify-between items-baseline text-xs font-mono mb-2">
                    <span className="text-white/80">Savings & Vault (Target: ≥ 20%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/50">
                        {fmtCurr(timeframeRule503020.savings.saved)} / {fmtCurr(timeframeRule503020.savings.targetAmount)}
                      </span>
                      <span className="font-bold text-emerald-400">
                        {timeframeRule503020.savings.actual}% <span className="text-white/40 font-normal">/ 20%</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, timeframeRule503020.savings.actual)}%` }} 
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/50 mt-1 block">
                    {timeframeRule503020.income > 0 ? (
                      timeframeRule503020.savings.actual >= 20
                        ? `✓ +${fmtCurr(timeframeRule503020.savings.saved - timeframeRule503020.savings.targetAmount)} surplus over 20% target`
                        : `⚠️ ${fmtCurr(timeframeRule503020.savings.targetAmount - timeframeRule503020.savings.saved)} short of 20% target`
                    ) : (
                      timeframeRule503020.savings.actual >= 20 ? '✓ Outstanding savings rate achieved' : '⚠️ Below 20% target savings'
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span>Standard: Elizabeth Warren 50/30/20</span>
              <span className="text-[#088fff] font-bold">Auto-Computed</span>
            </div>
          </div>
        </div>

        {/* AI PREDICTIVE ANOMALY & INSIGHT BANNER */}
        <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-8 shadow-md">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#1A1A1A]/10">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-lg font-editorial font-bold text-[#1A1A1A]">
                Smart Financial Insights & Recommendations
              </h2>
              <p className="text-xs text-[#1A1A1A]/60 font-light mt-0.5">
                Automated takeaways from your real income and spending patterns.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD 1: TOP EXPENSE */}
            <div className="p-5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#088fff] block mb-1">
                  INSIGHT 01 • BIGGEST SPEND
                </span>
                <h4 className="text-base font-bold text-[#1A1A1A] mb-2 font-editorial">
                  Where Your Money Goes Most
                </h4>
                {donutData.find(c => !c.isEmpty) ? (
                  (() => {
                    const top = donutData.find(c => !c.isEmpty);
                    const trimSavings = Math.round(top.value * 0.05);
                    return (
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-[#088fff] font-mono text-xs font-bold mb-3">
                          <span>{top.name}:</span>
                          <span>{top.percent}% of all spending</span>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/75 leading-relaxed font-light">
                          You spent <strong className="text-[#1A1A1A] font-semibold">{fmtCurr(Number(top.value))}</strong> on <strong className="text-[#1A1A1A] font-semibold">{top.name}</strong> this period. Trimming just 5% here saves you <strong className="text-emerald-700 font-semibold">~{fmtCurr(trimSavings)}/mo</strong> to put straight into your savings.
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-[#1A1A1A]/60 leading-relaxed font-light mt-2">
                    Log your daily expenses to see which category consumes the biggest portion of your budget and find easy savings.
                  </p>
                )}
              </div>
            </div>

            {/* CARD 2: EMERGENCY SAFETY BUFFER */}
            <div className="p-5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 block mb-1">
                  INSIGHT 02 • SAFETY NET
                </span>
                <h4 className="text-base font-bold text-[#1A1A1A] mb-2 font-editorial">
                  Emergency Fund Protection
                </h4>
                {Number(vault?.current || 0) > 0 ? (
                  (() => {
                    const vaultVal = Number(vault.current);
                    const monthsNum = Number(runwayMonths) || 0;
                    const daysCovered = Math.round(monthsNum * 30);
                    return (
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold mb-3">
                          <span>{monthsNum} Months ({daysCovered} Days) Protected</span>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/75 leading-relaxed font-light">
                          If your income stopped today, your <strong className="text-[#1A1A1A] font-semibold">{fmtCurr(vaultVal)}</strong> in Emergency Reserves would cover all living costs for about <strong className="text-emerald-700 font-semibold">{daysCovered} days ({monthsNum} mos)</strong>. Personal finance experts suggest working toward a 3–6 month cushion.
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs font-bold mb-3">
                      <span>Vault Unfunded ({symbol}0)</span>
                    </div>
                    <p className="text-xs text-[#1A1A1A]/75 leading-relaxed font-light">
                      You currently have no emergency cushion set aside. Transferring even a small monthly surplus into your Emergency Vault protects you against sudden unexpected bills.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 3: 1-YEAR SAVINGS OUTLOOK */}
            <div className="p-5 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-purple-600 block mb-1">
                  INSIGHT 03 • 1-YEAR OUTLOOK
                </span>
                <h4 className="text-base font-bold text-[#1A1A1A] mb-2 font-editorial">
                  Annual Savings Projection
                </h4>
                {periodIncome > 0 ? (
                  (() => {
                    const monthlySurplus = Math.round(periodNetSavings / Math.max(1, dynamicCashFlowData.length));
                    const annualTarget = Math.max(0, monthlySurplus * 12);
                    return (
                      <div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-bold mb-3 ${
                          monthlySurplus >= 0 
                            ? 'bg-purple-50 border border-purple-200 text-purple-700' 
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}>
                          <span>{monthlySurplus >= 0 ? `+${fmtCurr(annualTarget)}` : `-${fmtCurr(Math.abs(annualTarget))}`} projected in 12 mos</span>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/75 leading-relaxed font-light">
                          {monthlySurplus >= 0 ? (
                            <>You are keeping <strong className="text-emerald-700 font-semibold">+{fmtCurr(monthlySurplus)}</strong> in profit each month. Continuing at this pace will add <strong className="text-purple-700 font-semibold">+{fmtCurr(annualTarget)}</strong> to your net wealth over the next year.</>
                          ) : (
                            <>Your expenses currently exceed your income by <strong className="text-rose-600 font-semibold">{fmtCurr(Math.abs(monthlySurplus))}/mo</strong>. Lowering discretionary spend will turn your annual outlook positive.</>
                          )}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-[#1A1A1A]/60 leading-relaxed font-light mt-2">
                    Log your income and regular expenses to unlock 1-year wealth projections and compound growth milestones.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default AnalyticsPage;
