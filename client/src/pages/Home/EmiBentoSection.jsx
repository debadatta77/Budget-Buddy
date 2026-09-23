import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowRight, ArrowDownRight, Shield, CreditCard, Plus, Trash2, X } from 'lucide-react';

const THEME_MAP = {
    black: { name: 'Obsidian Midnight', gradient: 'linear-gradient(135deg, #090A0F 0%, #171923 50%, #0F172A 100%)' },
    blue: { name: 'Electric Sapphire', gradient: 'linear-gradient(135deg, #030712 0%, #0284C7 50%, #2563EB 100%)' },
    emerald: { name: 'Imperial Emerald', gradient: 'linear-gradient(135deg, #022C22 0%, #059669 50%, #10B981 100%)' },
    silver: { name: 'Platinum Titanium', gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 50%, #94A3B8 100%)' },
    purple: { name: 'Cosmic Violet', gradient: 'linear-gradient(135deg, #1E1B4B 0%, #6B21A8 50%, #C084FC 100%)' },
    gold: { name: 'Royal Champagne', gradient: 'linear-gradient(135deg, #451A03 0%, #B45309 50%, #F59E0B 100%)' },
    rose: { name: 'Rose Gold Metallic', gradient: 'linear-gradient(135deg, #4C0519 0%, #9F1239 50%, #FB7185 100%)' }
};

export const EmiBentoSection = ({ customCard }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [activeUserPage, setActiveUserPage] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Dynamic User EMI Cards State with LocalStorage Persistence
    const [userGroups, setUserGroups] = useState(() => {
        try {
            const saved = localStorage.getItem('bb_user_emi_cards');
            if (saved !== null) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn("Error loading user EMI cards:", e);
        }
        return [];
    });

    // Modal Form Inputs State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [dayInput, setDayInput] = useState('25');
    const [cardNumInput, setCardNumInput] = useState('');
    const [themeInput, setThemeInput] = useState('blue');

    useEffect(() => {
        try {
            localStorage.setItem('bb_user_emi_cards', JSON.stringify(userGroups));
        } catch (e) {
            console.warn("Error saving user EMI cards:", e);
        }
    }, [userGroups]);

    const handleAddCard = (e) => {
        e.preventDefault();
        if (!titleInput.trim() || !amountInput) return;

        const numAmount = parseFloat(amountInput) || 0;
        const formattedAmount = `₹${numAmount.toLocaleString('en-IN')}`;
        const cleanLast4 = cardNumInput.replace(/\D/g, '').slice(-4) || '9999';
        const selectedTheme = THEME_MAP[themeInput] || THEME_MAP.blue;

        const newCard = {
            id: Date.now().toString(),
            title: titleInput.trim(),
            cardLabel: `${titleInput.trim().toUpperCase()} LEDGER`,
            dueDay: parseInt(dayInput) || 1,
            amount: formattedAmount,
            latency: 'Auto-Debit Active',
            themeGradient: selectedTheme.gradient,
            themeKey: themeInput,
            cardNumber: `•••• •••• •••• ${cleanLast4}`,
            cardType: `${titleInput.trim().toUpperCase()} EMI`
        };

        setUserGroups(prev => [...prev, newCard]);
        setTitleInput('');
        setAmountInput('');
        setDayInput('25');
        setCardNumInput('');
    };

    const handleDeleteCard = (id) => {
        setUserGroups(prev => {
            const updated = prev.filter(item => item.id !== id);
            if (activeUserPage >= updated.length) {
                setActiveUserPage(Math.max(0, updated.length - 1));
            }
            return updated;
        });
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
        setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
        setMousePos({ x: 0, y: 0 });
    };

    const stepItems = [
        {
            label: '01',
            title: 'Add & View Expenses',
            icon: ArrowUpRight,
            href: '#expenses',
            desc: 'Add and view your expenses, set payment goals, and reminders.',
            action: () => {
                const el = document.getElementById('expenses') || document.querySelector('a[href="#expenses"]');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.location.hash = 'expenses';
                }
            }
        },
        {
            label: '02',
            title: 'Budget & Savings',
            icon: ArrowRight,
            href: '#savings',
            desc: 'Set up monthly loan EMIs, automated payment reminders, and due-date rollover tracking.',
            action: () => {
                const el = document.getElementById('savings') || document.querySelector('a[href="#savings"]');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.location.hash = 'savings';
                }
            }
        },
        {
            label: '03',
            title: 'Profile',
            icon: ArrowDownRight,
            href: '#profile',
            desc: 'Unlock smart spending analytics, budget forecasts, and personalized AI saving suggestions.',
            action: () => {
                const el = document.getElementById('profile') || document.querySelector('a[href="#profile"]');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.location.hash = 'profile';
                }
            }
        }
    ];

    const getEmiCalendarStatus = (card) => {
        if (!card) return {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const day = card.dueDay || 25;

        let currentTargetDate = new Date(currentYear, currentMonth, day);
        currentTargetDate.setHours(0, 0, 0, 0);

        let nextUpcomingDate;

        if (currentTargetDate >= today) {
            nextUpcomingDate = new Date(currentYear, currentMonth + 1, day);
        } else {
            currentTargetDate = new Date(currentYear, currentMonth + 1, day);
            nextUpcomingDate = new Date(currentYear, currentMonth + 2, day);
        }

        const formatDate = (d) => d.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const diffTime = currentTargetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let badgeText = `Due in ${diffDays} days`;
        if (diffDays === 0) badgeText = 'Due Today!';
        if (diffDays === 1) badgeText = 'Due Tomorrow';

        return {
            currentDueDate: formatDate(currentTargetDate),
            nextUpcomingDate: formatDate(nextUpcomingDate),
            badgeText
        };
    };

    const hasEmis = Array.isArray(userGroups) && userGroups.length > 0;
    const currentCard = hasEmis ? (userGroups[activeUserPage] || userGroups[0]) : null;
    const currentCardStatus = hasEmis ? getEmiCalendarStatus(currentCard) : null;
    const nextCardIndex = hasEmis ? (activeUserPage + 1) % userGroups.length : 0;
    const nextCard = hasEmis ? userGroups[nextCardIndex] : null;

    return (
        <>
            {/* Editorial Bento / Visual Centerpiece */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-12 pt-10 border-t border-[#1A1A1A]/10">
                {/* Left Column: Dark Live Status Terminal */}
                <div className="lg:col-span-4 flex flex-col">
                    <div
                        id="hero-active-users-card"
                        className="bg-[#1A1A1A] text-[#F9F8F5] p-7 rounded-sm flex flex-col justify-between shadow-xl flex-1 border border-[#1A1A1A]"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-8 pb-4 border-b border-white/10">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 block">
                                        Live Engine Status
                                    </span>
                                    <span className="text-xs text-white/80 font-mono mt-0.5 block">
                                        {hasEmis ? currentCard?.latency : 'No Active Engine'}
                                    </span>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${hasEmis ? 'bg-emerald-500 animate-pulse shadow-emerald-400' : 'bg-gray-500'}`}></div>
                            </div>

                            <div className="space-y-5">
                                <div className="border-b border-white/10 pb-4">
                                    <div className="text-[10px] uppercase tracking-wider opacity-40">
                                        Active EMIs this Month
                                    </div>
                                    <div className="text-3xl font-editorial font-medium tracking-tight text-white mt-1">
                                        {hasEmis ? `${userGroups.length} Active EMI${userGroups.length > 1 ? 's' : ''}` : 'Zero EMI'}
                                    </div>
                                </div>

                                <div className="border-b border-white/10 pb-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] uppercase tracking-wider opacity-40">
                                            Due Date this month
                                        </div>
                                        {hasEmis && currentCardStatus?.badgeText && (
                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                                {currentCardStatus.badgeText}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xl font-editorial text-white/90 mt-1">
                                        {hasEmis ? currentCardStatus?.currentDueDate : 'No EMI Due'}
                                    </div>
                                    <div className="text-[10px] text-white/50 font-mono mt-1">
                                        {hasEmis ? (
                                            <>Next Cycle: <span className="text-white/80 font-semibold">{currentCardStatus?.nextUpcomingDate}</span></>
                                        ) : (
                                            'No pending schedules'
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] uppercase tracking-wider opacity-40">
                                        EMI amount
                                    </div>
                                    <div className="text-xl font-editorial text-emerald-400 mt-1">
                                        {hasEmis ? currentCard?.amount : '₹0'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toggle switch */}
                        <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono">
                                {hasEmis ? `Card ${activeUserPage + 1} of ${userGroups.length}` : 'No EMIs Configured'}
                            </span>
                            <div className="flex items-center gap-2">
                                {userGroups.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveUserPage(idx)}
                                        aria-label={`Show EMI Card ${idx + 1}`}
                                        className={`h-2 rounded-full transition-all cursor-pointer ${activeUserPage === idx ? 'bg-[#088fff] w-5' : 'bg-white/30 hover:bg-white/60 w-2'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Column: 3D Editorial Physical Cards or Empty State */}
                <div
                    className="lg:col-span-4 flex flex-col justify-center items-center py-6 px-4 bg-white/60 border border-[#1A1A1A]/10 rounded-sm relative"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ perspective: 1200 }}
                >
                    {!hasEmis ? (
                        <div className="w-full max-w-[320px] h-[300px] flex flex-col items-center justify-center p-6 border border-dashed border-[#1A1A1A]/20 rounded-sm bg-white/40 text-center">
                            <div className="w-14 h-14 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center mb-3">
                                <CreditCard className="w-7 h-7 text-[#1A1A1A]/40" />
                            </div>
                            <h3 className="text-base font-editorial font-bold text-[#1A1A1A] uppercase tracking-wider">
                                NO ACTIVE EMI
                            </h3>
                            <p className="text-xs text-[#1A1A1A]/60 font-sans-clean mt-1 max-w-[210px] leading-relaxed">
                                You currently have no active EMI cards registered in your ledger.
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-5 text-[10px] uppercase tracking-widest font-bold bg-[#1A1A1A] hover:bg-[#088fff] text-white px-5 py-2.5 rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Your First EMI</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between w-full px-4 mb-4">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50 font-mono truncate max-w-[200px]">
                                    Specimen: {currentCard?.title}
                                </span>
                                <span className="text-[9px] font-mono font-bold text-[#088fff] bg-[#088fff]/10 px-2 py-0.5 rounded shrink-0">
                                    0{activeUserPage + 1} / 0{userGroups.length}
                                </span>
                            </div>

                            <div
                                className="relative w-full max-w-[320px] h-[300px] flex items-center justify-center cursor-pointer select-none group"
                                onClick={() => setActiveUserPage((prev) => (prev + 1) % userGroups.length)}
                                title="Click to flip to next EMI specimen"
                                style={{
                                    transform: `rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`,
                                    transition: 'transform 0.15s ease-out'
                                }}
                            >
                                {/* Back Card: Next Card in Queue */}
                                <div
                                    className="absolute w-64 h-40 rounded-sm p-4 flex flex-col justify-between shadow-2xl transition-all duration-500 border border-white/15"
                                    style={{
                                        background: nextCard?.themeGradient || 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
                                        transform: 'translate(-20px, 30px) rotate(-10deg)',
                                        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                                        opacity: 0.85
                                    }}
                                >
                                    <div className="flex justify-between items-start text-white/90">
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-3 h-3 fill-white/80" />
                                            <span className="text-[10px] font-bold font-editorial tracking-wider opacity-80">
                                                {nextCard?.cardType}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono bg-black/40 px-1 py-0.5 rounded text-emerald-300/90 font-bold border border-white/10">
                                            {nextCard?.amount}
                                        </span>
                                    </div>

                                    <div className="w-6 h-4 rounded-[2px] bg-amber-200/60 shadow-sm my-1"></div>

                                    <div className="flex justify-between items-end text-white/80">
                                        <div>
                                            <span className="text-[6px] uppercase tracking-widest opacity-60 block font-mono">NEXT IN QUEUE</span>
                                            <span className="text-[10px] font-mono font-bold tracking-wider block opacity-90 truncate max-w-[120px]">
                                                {nextCard?.cardLabel}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/70">
                                            {nextCard?.cardNumber?.slice(-4)}
                                        </span>
                                    </div>
                                </div>

                                {/* Front Card: Dynamically Linked to Active EMI Slide */}
                                <div
                                    className="absolute w-64 h-40 rounded-sm p-4 flex flex-col justify-between shadow-2xl transition-all duration-500 z-10 border border-white/20 group-hover:scale-105"
                                    style={{
                                        background: customCard?.theme === 'black'
                                            ? 'linear-gradient(135deg, #1C1C1F 0%, #0A0A0A 100%)'
                                            : customCard?.theme === 'silver'
                                                ? 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)'
                                                : customCard?.theme === 'emerald'
                                                    ? 'linear-gradient(135deg, #059669 0%, #064E3B 100%)'
                                                    : currentCard?.themeGradient || 'linear-gradient(135deg, #000000 0%, #088fff 100%)',
                                        transform: 'translate(15px, -15px) rotate(6deg)',
                                        boxShadow: '0 25px 45px -10px rgba(0, 0, 0, 0.35)'
                                    }}
                                >
                                    <div className="flex justify-between items-start text-white">
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5 fill-white" />
                                            <span className="text-xs font-bold font-editorial tracking-wider truncate max-w-[130px]">
                                                {currentCard?.cardType}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-emerald-300 font-bold border border-white/10">
                                            {currentCard?.amount}
                                        </span>
                                    </div>

                                    <div className="w-7 h-5 rounded-[2px] bg-amber-200/90 shadow-sm my-1"></div>

                                    <div className="flex justify-between items-end text-white">
                                        <div>
                                            <span className="text-[7px] uppercase tracking-widest opacity-70 block font-mono">SPECIMEN LEDGER</span>
                                            <span className="text-[11px] font-mono font-bold tracking-wider block truncate max-w-[140px]">
                                                {customCard?.holderName || currentCard?.cardLabel}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono uppercase bg-black/30 px-1.5 py-0.5 rounded text-white/90">
                                            {currentCard?.cardNumber?.slice(-4)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    onClick={() => setActiveUserPage((prev) => (prev + 1) % userGroups.length)}
                                    className="text-[10px] uppercase tracking-widest font-bold text-[#088fff] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Next Card</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                                <span className="text-gray-300">•</span>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]/70 hover:text-[#088fff] flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Input/update</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Sequential Phase List linked to Navbar */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                    {stepItems.map((step, idx) => {
                        const IconComp = step.icon;
                        const isSelected = activeStep === idx;
                        return (
                            <a
                                key={idx}
                                href={step.href}
                                onClick={() => {
                                    setActiveStep(idx);
                                    if (step.action) step.action();
                                }}
                                className={`border p-5 rounded-sm cursor-pointer transition-all duration-200 block group relative ${isSelected
                                    ? 'bg-white border-[#1A1A1A] shadow-md ring-1 ring-[#1A1A1A]/10'
                                    : 'bg-white/40 border-[#1A1A1A]/10 hover:bg-white/90 hover:border-[#1A1A1A]/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#088fff]">
                                        {step.label}
                                    </span>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSelected
                                        ? 'bg-[#1A1A1A] text-[#F9F8F5] scale-105'
                                        : 'bg-[#1A1A1A]/5 text-[#1A1A1A]/60 group-hover:bg-[#088fff] group-hover:text-white'
                                        }`}>
                                        <IconComp className="w-3.5 h-3.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-editorial font-bold text-[#1A1A1A] flex items-center justify-between">
                                    <span>{step.title}</span>
                                    <span className="text-[9px] font-mono font-bold text-[#088fff] bg-[#088fff]/10 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        Navigate →
                                    </span>
                                </h3>

                                <p className="mt-2 text-xs text-[#1A1A1A]/70 leading-relaxed font-sans-clean">
                                    {step.desc}
                                </p>
                            </a>
                        );
                    })}
                </div>
            </div>

            {/* Interactive User EMI & Card Input/Update Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-[#1A1A1A] text-[#F9F8F5] border border-white/20 rounded-md p-6 max-w-lg w-full shadow-2xl relative">
                        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-[#088fff]" />
                                <h3 className="text-sm font-editorial font-bold text-white uppercase tracking-wider">
                                    Input / Update EMI Cards
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/60 hover:text-white text-base font-bold p-1 cursor-pointer rounded hover:bg-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* List of active cards */}
                        <div className="space-y-2 mb-5">
                            <label className="text-[10px] font-mono uppercase text-white/60 font-bold block">
                                Active Cards List ({userGroups.length})
                            </label>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {userGroups.map((card) => (
                                    <div key={card.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded text-xs">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-8 rounded-[2px]"
                                                style={{ background: card.themeGradient }}
                                            ></div>
                                            <div>
                                                <span className="font-semibold text-white block">{card.title}</span>
                                                <span className="text-[10px] text-white/60 font-mono block">
                                                    {card.amount} • Due on {card.dueDay}{card.dueDay === 1 ? 'st' : card.dueDay === 2 ? 'nd' : card.dueDay === 3 ? 'rd' : 'th'} • Card {card.cardNumber}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 cursor-pointer flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add New Card Form */}
                        <form onSubmit={handleAddCard} className="space-y-3 pt-4 border-t border-white/10">
                            <div className="text-xs font-bold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-[#088fff]" />
                                <span>Add New EMI Specimen Card</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[10px] uppercase text-white/60 font-mono block mb-1">Loan / EMI Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Laptop EMI"
                                        value={titleInput}
                                        onChange={(e) => setTitleInput(e.target.value)}
                                        className="bg-white/5 border border-white/15 text-xs text-white p-2 rounded w-full focus:outline-none focus:border-[#088fff]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase text-white/60 font-mono block mb-1">Monthly EMI Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="e.g. 4500"
                                        value={amountInput}
                                        onChange={(e) => setAmountInput(e.target.value)}
                                        className="bg-white/5 border border-white/15 text-xs text-white p-2 rounded w-full focus:outline-none focus:border-[#088fff]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                    <label className="text-[10px] uppercase text-white/60 font-mono block mb-1">Due Day of Month</label>
                                    <select
                                        value={dayInput}
                                        onChange={(e) => setDayInput(e.target.value)}
                                        className="bg-[#2A2A2A] border border-white/15 text-xs text-white p-2 rounded w-full focus:outline-none focus:border-[#088fff]"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                            <option key={d} value={d}>Day {d} of month</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase text-white/60 font-mono block mb-1">Card Last 4 Digits</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        placeholder="e.g. 4821"
                                        value={cardNumInput}
                                        onChange={(e) => setCardNumInput(e.target.value)}
                                        className="bg-white/5 border border-white/15 text-xs text-white p-2 rounded w-full focus:outline-none focus:border-[#088fff]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase text-white/60 font-mono block mb-1">Card Specimen Theme</label>
                                    <select
                                        value={themeInput}
                                        onChange={(e) => setThemeInput(e.target.value)}
                                        className="bg-[#2A2A2A] border border-white/15 text-xs text-white p-2 rounded w-full focus:outline-none focus:border-[#088fff]"
                                    >
                                        {Object.entries(THEME_MAP).map(([key, val]) => (
                                            <option key={key} value={key}>{val.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-xs text-white/70 hover:text-white px-4 py-2 rounded bg-white/5 border border-white/10 cursor-pointer"
                                >
                                    Close / Done
                                </button>
                                <button
                                    type="submit"
                                    className="text-xs font-bold text-white bg-[#088fff] hover:bg-[#088fff]/80 px-4 py-2 rounded cursor-pointer flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add EMI Specimen Card</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default EmiBentoSection;
