import { useState, useEffect } from 'react';
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownRight, 
    Activity, 
    TrendingUp, 
    Plus, 
    Download, 
    Sparkles, 
    ShieldCheck, 
    PieChart, 
    Clock,
    X,
    Trash2
} from 'lucide-react';
import { 
    getUserTransactions, 
    addUserTransaction, 
    deleteUserTransaction, 
    calculateFinancialTelemetry 
} from '../../services/userDataService';

export const DashboardSection = () => {
    // Dynamic User Telemetry State
    const [telemetry, setTelemetry] = useState(calculateFinancialTelemetry());
    const [transactions, setTransactions] = useState(getUserTransactions());
    const [timeRange, setTimeRange] = useState('Monthly');

    // Add Expense Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newCategory, setNewCategory] = useState('Groceries');
    const [newType, setNewType] = useState('expense');

    useEffect(() => {
        const handleSync = () => {
            setTelemetry(calculateFinancialTelemetry());
            setTransactions(getUserTransactions());
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, []);

    const { summary, categories } = telemetry;
    const { totalIncome, totalExpense, netSavings, netWorth, totalVaultSavings } = summary;
    const healthScore = totalIncome > 0 ? Math.min(99, Math.max(50, Math.round(Number(summary.savingsRate) + 30))) : 75;

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
        <section id="dashboard" className="bg-[#F9F8F5] text-[#1A1A1A] py-20 lg:py-28 border-b border-[#1A1A1A]/15">
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
                                ₹{netWorth.toLocaleString('en-IN')}
                            </div>
                            <div className="flex flex-col gap-0.5 text-[10px] font-mono text-[#1A1A1A]/70 pt-1 border-t border-[#1A1A1A]/10">
                                <span className="font-bold text-[#088fff]">Formula: (Income - Burn) + Vault</span>
                                <span>₹{totalIncome.toLocaleString('en-IN')} - ₹{totalExpense.toLocaleString('en-IN')} + ₹{totalVaultSavings.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 2: Monthly Burn Rate */}
                    <div className="bg-white rounded-sm p-6 shadow-md border border-[#1A1A1A]/15 flex flex-col justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 font-bold font-mono">
                                Monthly Outflow / Burn
                            </span>
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                                <ArrowDownRight className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-editorial font-bold text-rose-600 leading-none mb-2">
                                ₹{totalExpense.toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-[#1A1A1A]/60 pt-1 border-t border-[#1A1A1A]/10">
                                <span>Sum of Recorded Expenses</span>
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
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl sm:text-4xl font-editorial font-bold text-emerald-600 leading-none mb-2">
                                ₹{totalIncome.toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-[#088fff] pt-1 border-t border-[#1A1A1A]/10">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span className="font-bold">Total Recorded Income</span>
                            </div>
                        </div>
                    </div>

                    {/* Stat Card 4: Financial Health Score */}
                    <div className="bg-[#1A1A1A] text-white rounded-sm p-6 shadow-md border border-[#1A1A1A] flex flex-col justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold font-mono">
                                AI Health Index
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#088fff]">
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
                            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 pt-1 border-t border-white/10">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="font-bold">{healthScore >= 80 ? 'OPTIMAL' : 'GOOD'}</span>
                                <span className="text-white/40 font-normal">• Calibrated</span>
                            </div>
                        </div>
                    </div>
                </div>

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

                            {/* Stacked Visual Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center text-xs font-mono text-[#1A1A1A]/70 mb-2">
                                    <span>Total Logged Expenses: ₹{totalExpense.toLocaleString('en-IN')}</span>
                                    <span className="font-bold text-[#088fff]">{categories.length} Categories</span>
                                </div>
                                <div className="w-full h-4 bg-[#1A1A1A]/5 rounded-sm overflow-hidden flex">
                                    {categories.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="h-full transition-all duration-300 border-r border-white/20"
                                            style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                                            title={`${item.name}: ₹${item.amount} (${item.percent}%)`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Category Rows */}
                            <div className="space-y-3.5">
                                {categories.length === 0 ? (
                                    <div className="p-6 text-center text-xs font-mono text-[#1A1A1A]/50">
                                        No expense transactions recorded yet. Click "Quick Log" to add an entry!
                                    </div>
                                ) : (
                                    categories.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm hover:border-[#1A1A1A]/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                                                    ₹{item.amount.toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold bg-[#1A1A1A]/5 px-2 py-0.5 rounded text-[#1A1A1A]/70 min-w-[45px] text-right">
                                                    {item.percent}%
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[10px] font-mono text-[#1A1A1A]/50">
                            <span>Telemetry Sync: Active</span>
                            <span className="flex items-center gap-1 text-[#088fff] font-bold">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                Monthly Net Worth Engine
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
                                                    {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
                                                    {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTx(tx.id)}
                                                    className="text-[#1A1A1A]/30 hover:text-rose-600 p-1 cursor-pointer"
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
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-[11px] uppercase tracking-widest font-bold text-[#088fff] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add New Entry</span>
                            </button>

                            <button
                                onClick={() => alert('Exporting live user telemetry CSV...')}
                                className="text-[11px] uppercase tracking-widest font-bold text-[#1A1A1A]/60 hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export Report</span>
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
                                    <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                        Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewType('expense')}
                                            className={`py-2 text-xs font-mono font-bold rounded-sm border cursor-pointer ${
                                                newType === 'expense' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white/5 text-white/60 border-white/15'
                                            }`}
                                        >
                                            Expense (-)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewType('income')}
                                            className={`py-2 text-xs font-mono font-bold rounded-sm border cursor-pointer ${
                                                newType === 'income' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/5 text-white/60 border-white/15'
                                            }`}
                                        >
                                            Income (+)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                        Title / Payee
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Salary Credit, D-Mart Groceries"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="1500"
                                            value={newAmount}
                                            onChange={(e) => setNewAmount(e.target.value)}
                                            className="w-full bg-white/5 border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                        >
                                            <option value="Groceries">Groceries</option>
                                            <option value="Housing">Housing</option>
                                            <option value="Utilities">Utilities</option>
                                            <option value="EMI">EMI</option>
                                            <option value="Subscription">Subscription</option>
                                            <option value="Income">Income</option>
                                            <option value="Food">Food</option>
                                            <option value="Travel">Travel</option>
                                        </select>
                                    </div>
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
            </div>
        </section>
    );
};

export default DashboardSection;
