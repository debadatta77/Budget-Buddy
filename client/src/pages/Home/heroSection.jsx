import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    ArrowUpRight, 
    Sparkles, 
    TrendingUp, 
    ShieldCheck, 
    Wallet, 
    Layers, 
    BarChart3, 
    PieChart, 
    FileText, 
    PiggyBank,
    ArrowRight,
    Plus,
    Zap
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { AboutUs } from '../about/AboutUs';
import { Testimonials } from '../testimonials/Testimonials';
import { Footer } from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { QuickLogModal } from '../../components/modals/QuickLogModal';
import { calculateFinancialTelemetry } from '../../services/userDataService';
import { AuthContext } from '../../context/AuthContext';
import { useCurrency } from '../../utils/formatCurrency';

export const Hero = ({ onGetStarted, onOpenCardStudio, customCard }) => {
    const { symbol, formatCurrency: fmtCurr } = useCurrency();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useContext(AuthContext);
    const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
    const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
    const [getStartedMode, setGetStartedMode] = useState('signup');
    const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
    const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
    const [quickLogSuccessToast, setQuickLogSuccessToast] = useState(null);
    const [telemetry, setTelemetry] = useState(() => calculateFinancialTelemetry());

    const [activeCustomCard, setActiveCustomCard] = useState(customCard || {
        holderName: 'Ralph Edwards',
        cardNumber: '•••• •••• •••• 4821',
        expiryDate: '12/28',
        cvv: '894',
        theme: 'black'
    });

    const handleOpenGetStarted = (mode = 'signup') => {
        setGetStartedMode(typeof mode === 'string' ? mode : 'signup');
        if (onGetStarted) onGetStarted(mode);
        setIsGetStartedOpen(true);
    };

    const handleOpenCardStudio = () => {
        if (onOpenCardStudio) onOpenCardStudio();
        setIsCardStudioOpen(true);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleSync = () => {
            setTelemetry(calculateFinancialTelemetry());
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, []);

    useEffect(() => {
        if (location.state?.openAuth) {
            handleOpenGetStarted('signin');
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).toUpperCase();

    const formattedMonthYear = currentDateTime.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    }).toUpperCase();

    const { summary, rule503020 } = telemetry;

    return (
        <div className="w-full min-h-screen bg-[#F9F8F5]">
            <Navbar onOpenSignUp={handleOpenGetStarted} onOpenCardStudio={handleOpenCardStudio} />

            {/* HERO BANNER */}
            <section
                id="hero"
                className="relative bg-[#F9F8F5] text-[#1A1A1A] pt-20 pb-10 lg:pt-24 lg:pb-14 border-b border-[#1A1A1A]/15 overflow-hidden"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Hero Header Eyebrow */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6 sm:mb-8 gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#088fff]/10 border border-[#088fff]/20 text-[#088fff] text-xs font-semibold tracking-wide">
                                <Sparkles className="w-3.5 h-3.5 text-[#088fff]" />
                                <span>Personal Wealth & Expense Tracker</span>
                            </span>
                        </div>

                        {/* Quick Log Action on Home */}
                        <div className="flex items-center gap-2.5">
                            {quickLogSuccessToast && (
                                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 animate-fadeIn">
                                    <span>✓</span>
                                    <span>Logged {fmtCurr(quickLogSuccessToast.amount)} ({quickLogSuccessToast.title})</span>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        handleOpenGetStarted('signin');
                                    } else {
                                        setIsQuickLogOpen(true);
                                    }
                                }}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono font-bold tracking-wider transition-all duration-200 shadow-sm hover:shadow cursor-pointer group"
                                title="Quickly record an expense or income entry"
                            >
                                <Zap className="w-3.5 h-3.5 text-[#088fff] group-hover:text-white transition-colors fill-current" />
                                <span>QUICK LOG</span>
                                <span className="text-[10px] text-white/60 group-hover:text-white/90 font-normal hidden sm:inline">• ⚡ Fast</span>
                            </button>
                        </div>
                    </div>

                    {/* Editorial Headline & Telemetry Preview Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left: Editorial Hero Headline */}
                        <div className="lg:col-span-7">
                            <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-medium tracking-tighter leading-[0.94] text-[#1A1A1A] font-editorial select-none">
                                SECURE YOUR <br />
                                <span className="italic sm:ml-12 text-[#088fff] inline-block font-normal">
                                    FINANCIAL
                                </span>{' '}
                                FUTURE
                            </h1>

                            <p className="mt-8 text-lg sm:text-xl text-[#1A1A1A]/80 font-light leading-relaxed max-w-xl font-sans-clean">
                                Track every expense, understand every Rupee, and achieve complete wealth clarity. Powered by real-time telemetry, 50/30/20 budget framework, and an intelligent AI financial advisor.
                            </p>

                            {/* Editorial CTA Buttons */}
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                {!isAuthenticated ? (
                                    <>
                                        <button
                                            onClick={() => handleOpenGetStarted('signup')}
                                            id="hero-get-started-cta"
                                            className="bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-8 rounded-sm shadow-md transition-all duration-200 flex items-center gap-3 group cursor-pointer"
                                        >
                                            <span>GET STARTED</span>
                                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </button>

                                        <button
                                            onClick={() => handleOpenGetStarted('signin')}
                                            className="bg-white border border-[#1A1A1A]/30 hover:border-[#1A1A1A] text-[#1A1A1A] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-6 rounded-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                                        >
                                            <span>Explore Dashboard</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                            onClick={() => handleOpenGetStarted('signin')}
                                            className="border border-[#088fff]/40 hover:border-[#088fff] hover:bg-[#088fff]/5 text-[#088fff] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-6 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            <span>AI Advisor</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/dashboard"
                                            id="hero-dashboard-primary-cta"
                                            className="bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-8 rounded-sm shadow-md transition-all duration-200 flex items-center gap-3 group cursor-pointer"
                                        >
                                            <span>LAUNCH DASHBOARD</span>
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                        </Link>

                                        <Link
                                            to="/expenses"
                                            className="bg-white border border-[#1A1A1A]/30 hover:border-[#1A1A1A] text-[#1A1A1A] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-6 rounded-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
                                        >
                                            <span>View Ledger</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>

                                        <Link
                                            to="/ai-advisor"
                                            className="border border-[#088fff]/40 hover:border-[#088fff] hover:bg-[#088fff]/5 text-[#088fff] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-6 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            <span>AI Advisor</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Live Editorial Telemetry Card (Replaces Cramped Chat Box) */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-7 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#088fff]/10 to-transparent rounded-bl-full pointer-events-none"></div>

                                <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-[#088fff]" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-[#1A1A1A]/70">
                                            LIVE TELEMETRY SNAPSHOT
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        SYNCED
                                    </span>
                                </div>

                                {/* Net Worth Display */}
                                <div className="mb-6">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50 block mb-1">
                                        MONTHLY ESTIMATED NET WORTH
                                    </span>
                                    <div className="text-4xl sm:text-5xl font-editorial font-bold text-[#1A1A1A] tracking-tight">
                                        {fmtCurr(Number(summary?.netWorth) || 0)}
                                    </div>
                                </div>

                                {/* Quick KPIs Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-[#F9F8F5] p-3.5 rounded-sm border border-[#1A1A1A]/10">
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]/60 block mb-1">
                                            Monthly Cashflow
                                        </span>
                                        <div className="text-lg font-bold font-mono text-emerald-600">
                                            {Number(summary?.netSavings) >= 0 ? '+' : ''}{fmtCurr(Number(summary?.netSavings) || 0)}
                                        </div>
                                    </div>

                                    <div className="bg-[#F9F8F5] p-3.5 rounded-sm border border-[#1A1A1A]/10">
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#1A1A1A]/60 block mb-1">
                                            Savings Rate
                                        </span>
                                        <div className="text-lg font-bold font-mono text-[#088fff]">
                                            {Number(summary?.savingsRate) || 0}%
                                        </div>
                                    </div>
                                </div>

                                {/* 50/30/20 Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold mb-2">
                                        <span className="text-[#1A1A1A]/70 font-mono">50/30/20 Wealth Allocation</span>
                                        <span className="text-[#088fff] font-mono">
                                            {summary?.totalIncome > 0 ? 'Balanced' : 'Awaiting Data'}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-[#1A1A1A]/10 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${rule503020?.needs?.actual || 0}%` }} className="bg-[#088fff]" title="Needs"></div>
                                        <div style={{ width: `${rule503020?.wants?.actual || 0}%` }} className="bg-amber-500" title="Wants"></div>
                                        <div style={{ width: `${rule503020?.savings?.actual || 0}%` }} className="bg-emerald-500" title="Savings"></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-mono text-[#1A1A1A]/60 mt-1.5">
                                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#088fff]"></span> Needs ({rule503020?.needs?.actual || 0}%)</span>
                                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Wants ({rule503020?.wants?.actual || 0}%)</span>
                                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Savings ({rule503020?.savings?.actual || 0}%)</span>
                                    </div>
                                </div>

                                {/* Direct Module Navigation Links */}
                                <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between gap-2">
                                    <Link
                                        to="/expenses"
                                        className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#088fff] transition-colors py-1 flex items-center gap-1"
                                    >
                                        <span>Ledger</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                    </Link>
                                    <span className="text-[#1A1A1A]/20">•</span>
                                    <Link
                                        to="/budget"
                                        className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#088fff] transition-colors py-1 flex items-center gap-1"
                                    >
                                        <span>Vault</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                    </Link>
                                    <span className="text-[#1A1A1A]/20">•</span>
                                    <Link
                                        to="/emi-studio"
                                        className="text-[10px] uppercase tracking-wider font-bold text-[#088fff] hover:text-[#1A1A1A] transition-colors py-1 flex items-center gap-1"
                                    >
                                        <span>EMI</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                    </Link>
                                    <span className="text-[#1A1A1A]/20">•</span>
                                    <Link
                                        to="/analytics"
                                        className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#088fff] transition-colors py-1 flex items-center gap-1"
                                    >
                                        <span>Charts</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                    </Link>
                                    <span className="text-[#1A1A1A]/20">•</span>
                                    <Link
                                        to="/reports"
                                        className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#088fff] transition-colors py-1 flex items-center gap-1"
                                    >
                                        <span>Reports</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENTO PLATFORM MODULES OVERVIEW */}
            <section className="py-12 lg:py-16 bg-[#F9F8F5] border-b border-[#1A1A1A]/15">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 pb-8 border-b border-[#1A1A1A]/10">
                        <div className="lg:col-span-7">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#088fff]/10 text-[#088fff] text-xs font-semibold uppercase tracking-wider mb-3">
                                Platform Features
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
                                Built for Complete <br />
                                <span className="italic text-[#088fff]">Financial Control</span>
                            </h2>
                        </div>
                        <div className="lg:col-span-5">
                            <p className="text-base sm:text-lg text-[#1A1A1A]/80 font-light leading-relaxed font-sans-clean">
                                Explore the specialized modules designed to bring institutional-grade discipline, live telemetry, and AI intelligence to your daily personal finances.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Module 1: Dashboard */}
                        <Link 
                            to="/dashboard"
                            className="bg-white border border-[#1A1A1A]/15 p-8 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-sm bg-[#1A1A1A] text-white flex items-center justify-center mb-6 group-hover:bg-[#088fff] transition-colors">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-2">Module 01</span>
                                <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-3">Financial Control Center</h3>
                                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-light">
                                    Instant portfolio telemetry, Monthly Net Worth tracking, liquidity velocity, and quick income/expense logging in real time.
                                </p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#088fff]">
                                <span>Open Dashboard</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </Link>

                        {/* Module 2: Expenses Ledger */}
                        <Link 
                            to="/expenses"
                            className="bg-white border border-[#1A1A1A]/15 p-8 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-sm bg-[#1A1A1A] text-white flex items-center justify-center mb-6 group-hover:bg-[#088fff] transition-colors">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-2">Module 02</span>
                                <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-3">Real-Time Ledger</h3>
                                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-light">
                                    Comprehensive transaction management with search filtering, multi-category tags, and automated monthly burn rate calculations.
                                </p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#088fff]">
                                <span>View Ledger</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </Link>

                        {/* Module 3: 50/30/20 & Emergency Vault */}
                        <Link 
                            to="/budget"
                            className="bg-white border border-[#1A1A1A]/15 p-8 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-sm bg-[#1A1A1A] text-white flex items-center justify-center mb-6 group-hover:bg-[#088fff] transition-colors">
                                    <PiggyBank className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-2">Module 03</span>
                                <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-3">50/30/20 & Vault Reserves</h3>
                                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-light">
                                    Automatic income allocation into Needs (50%), Wants (30%), and Savings (20%) with interactive Emergency Vault reserve targets.
                                </p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#088fff]">
                                <span>Configure Budget</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </Link>

                        {/* Module 4: Dedicated AI Financial Advisor */}
                        <Link 
                            to="/ai-advisor"
                            className="bg-white border border-[#088fff]/30 p-8 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-400/10 to-transparent rounded-bl-full pointer-events-none"></div>
                            <div>
                                <div className="w-10 h-10 rounded-sm bg-[#088fff] text-white flex items-center justify-center mb-6">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-2">Module 04</span>
                                <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-3">Gemini AI Advisor</h3>
                                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-light">
                                    Dedicated conversational intelligence trained on personal finance best practices, budgeting strategies, and spending optimization.
                                </p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#088fff]">
                                <span>Launch AI Workspace</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </Link>

                        {/* Module 5: Analytics & Telemetry */}
                        <Link 
                            to="/analytics"
                            className="bg-white border border-[#1A1A1A]/15 p-8 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-sm bg-[#1A1A1A] text-white flex items-center justify-center mb-6 group-hover:bg-[#088fff] transition-colors">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-2">Module 05</span>
                                <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-3">Financial Analytics</h3>
                                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-light">
                                    Multi-month cash flow trajectory, category spending breakdowns, burn rates, and financial health index auditing.
                                </p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#088fff]">
                                <span>Explore Analytics</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </Link>

                        {/* Module 6: Executive Statements */}
                        <Link 
                            to="/reports"
                            className="bg-white border border-[#1A1A1A]/15 p-8 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="w-10 h-10 rounded-sm bg-[#1A1A1A] text-white flex items-center justify-center mb-6 group-hover:bg-[#088fff] transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-mono text-[#088fff] font-bold block mb-2">Module 06</span>
                                <h3 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-3">Executive Statements</h3>
                                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed font-light">
                                    Automated month-end financial statement generation, custom section delivery toggles, and direct HTML/PDF report export.
                                </p>
                            </div>
                            <div className="pt-6 mt-6 border-t border-[#1A1A1A]/10 flex items-center justify-between text-xs font-bold font-mono uppercase tracking-wider text-[#1A1A1A] group-hover:text-[#088fff]">
                                <span>Generate Statements</span>
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* BRAND COMPENDIUM & PERSPECTIVES */}
            <AboutUs />
            <Testimonials />
            <Footer onGetStarted={handleOpenGetStarted} />

            {/* Modals */}
            <GetStartedModal
                isOpen={isGetStartedOpen}
                initialMode={getStartedMode}
                onClose={() => setIsGetStartedOpen(false)}
                onSuccess={(name) => console.log('Account created for:', name)}
            />
            <CardCustomizerModal
                isOpen={isCardStudioOpen}
                onClose={() => setIsCardStudioOpen(false)}
                cardData={activeCustomCard}
                onSave={(newData) => setActiveCustomCard(newData)}
            />
            <QuickLogModal
                isOpen={isQuickLogOpen}
                onClose={() => setIsQuickLogOpen(false)}
                onSuccess={(tx) => {
                    setQuickLogSuccessToast(tx);
                    setTimeout(() => setQuickLogSuccessToast(null), 4000);
                }}
            />
        </div>
    );
};

export const HeroSection = Hero;
export default Hero;
