import { useState, useEffect, useMemo } from 'react';
import { 
    CreditCard, 
    Calculator, 
    Calendar, 
    Shield, 
    Plus, 
    Trash2, 
    ArrowUpRight, 
    Sparkles, 
    Sliders, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    X,
    RotateCcw,
    PieChart,
    ShieldCheck,
    Check,
    Pencil,
    Activity,
    Landmark,
    Layers,
    ArrowRight,
    Wallet,
    Percent,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { HealthScoreModal, calculateHealthBreakdown } from '../../components/modals/HealthScoreModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { 
    calculateFinancialTelemetry, 
    getUserBudget, 
    getUserCreditCards,
    saveUserCreditCards,
    addUserCreditCard,
    updateUserCreditCard,
    deleteUserCreditCard,
    addUserTransaction,
    deleteUserTransaction
} from '../../services/userDataService';
import { emiCardAPI, TOKEN_STORAGE_KEY } from '../../services/apiClient';
import { useCurrency } from '../../utils/formatCurrency';

import { useAuth } from '../../context/AuthContext';

const THEME_MAP = {
    black: { name: 'Obsidian Midnight', gradient: 'linear-gradient(135deg, #090A0F 0%, #171923 50%, #0F172A 100%)', badge: 'bg-zinc-800 text-zinc-200' },
    blue: { name: 'Electric Sapphire', gradient: 'linear-gradient(135deg, #030712 0%, #0284C7 50%, #2563EB 100%)', badge: 'bg-blue-900 text-blue-200' },
    emerald: { name: 'Imperial Emerald', gradient: 'linear-gradient(135deg, #022C22 0%, #059669 50%, #10B981 100%)', badge: 'bg-emerald-900 text-emerald-200' },
    silver: { name: 'Platinum Titanium', gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 50%, #94A3B8 100%)', badge: 'bg-slate-750 text-slate-200' },
    purple: { name: 'Cosmic Violet', gradient: 'linear-gradient(135deg, #1E1B4B 0%, #6B21A8 50%, #C084FC 100%)', badge: 'bg-purple-900 text-purple-200' },
    gold: { name: 'Royal Champagne', gradient: 'linear-gradient(135deg, #451A03 0%, #B45309 50%, #F59E0B 100%)', badge: 'bg-amber-900 text-amber-200' },
    rose: { name: 'Rose Gold Metallic', gradient: 'linear-gradient(135deg, #4C0519 0%, #9F1239 50%, #FB7185 100%)', badge: 'bg-rose-900 text-rose-200' }
};

const CC_NETWORKS = ['Visa', 'Mastercard', 'RuPay', 'Amex'];
const BANK_PRESETS = [
    'HDFC Bank', 
    'ICICI Bank', 
    'SBI Card', 
    'Axis Bank', 
    'Kotak Mahindra', 
    'IDFC FIRST Bank',
    'IndusInd Bank',
    'Bank of Baroda',
    'Punjab National Bank',
    'American Express', 
    'Standard Chartered', 
    'RBL Bank',
    'Federal Bank',
    'Yes Bank',
    'HSBC',
    'AU Small Finance Bank',
    'Canara Bank',
    'Union Bank of India',
    'Other Bank'
];

const DEFAULT_EMI_CARDS = [];

const DEFAULT_CC_FORM = {
    cardName: '',
    bankName: 'HDFC Bank',
    customBankName: '',
    network: 'Visa',
    creditLimit: '',
    currentBalance: '',
    statementDay: 15,
    dueDay: 5,
    last4: '',
    holderName: '',
    themeKey: 'black'
};

const LOAN_CATEGORIES = [
    { id: 'Consumer / No-Cost EMI', label: 'No-Cost / Consumer EMI', icon: '📱', defaultRate: 0, defaultTenure: 6, placeholder: 'e.g. Apple iPhone 16 (HDFC EMI)' },
    { id: 'Personal Loan', label: 'Personal Loan', icon: '👤', defaultRate: 11.5, defaultTenure: 12, placeholder: 'e.g. HDFC Instant Personal Loan' },
    { id: 'Vehicle Loan', label: 'Car / Bike Loan', icon: '🚗', defaultRate: 9.0, defaultTenure: 36, placeholder: 'e.g. SBI Auto Loan (Creta)' },
    { id: 'Home Loan', label: 'Home Loan / Mortgage', icon: '🏠', defaultRate: 8.5, defaultTenure: 120, placeholder: 'e.g. ICICI Home Loan' },
    { id: 'Education Loan', label: 'Education Loan', icon: '🎓', defaultRate: 9.5, defaultTenure: 48, placeholder: 'e.g. Axis Education Loan' },
    { id: 'Credit Card EMI', label: 'Credit Card Balance EMI', icon: '💳', defaultRate: 14.0, defaultTenure: 9, placeholder: 'e.g. OneCard Converted EMI' },
    { id: 'Other Loan', label: 'Other Debt Obligation', icon: '📋', defaultRate: 10.0, defaultTenure: 12, placeholder: 'e.g. Personal Note / Family Loan' }
];

// Financial standard EMI computation (E = P * r * (1+r)^n / ((1+r)^n - 1))
// If annualRate === 0: E = round(P / n)
export const computeStandardEmi = (principal, annualRate, tenureMonths) => {
    const P = Number(principal) || 0;
    const n = Math.max(1, Number(tenureMonths) || 1);
    const rAnnual = Number(annualRate) || 0;

    if (P <= 0) return 0;
    if (rAnnual <= 0) {
        return Math.round(P / n);
    }
    const rMonthly = rAnnual / (12 * 100);
    const factor = Math.pow(1 + rMonthly, n);
    if (!isFinite(factor) || factor <= 1) {
        return Math.round(P / n);
    }
    const emi = (P * rMonthly * factor) / (factor - 1);
    return Math.round(emi);
};

const DEFAULT_NEW_LOAN_FORM = {
    title: '',
    category: 'Consumer / No-Cost EMI',
    principal: '',
    amount: '',
    tenureMonths: 6,
    paidInstallments: 0,
    annualRate: 0,
    isZeroInterest: true,
    dueDay: 5,
    last4: '',
    theme: 'black'
};

export const EmiStudioPage = () => {
    const { symbol, formatCurrency, formatCompact } = useCurrency();
    const { isAuthenticated, user } = useAuth();
    const [activeStudioTab, setActiveStudioTab] = useState('loans'); // 'loans' | 'cards'
    const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
    const [showDtiModal, setShowDtiModal] = useState(false);
    const [showFullHealthModal, setShowFullHealthModal] = useState(false);

    // Confirm Payment with Cashflow Sync Modal State
    const [payingEmiCard, setPayingEmiCard] = useState(null);
    const [logToCashflow, setLogToCashflow] = useState(false);

    // Delete Confirmation Modals State
    const [pendingDeleteLoan, setPendingDeleteLoan] = useState(null);
    const [pendingDeleteCc, setPendingDeleteCc] = useState(null);

    // Active EMI Ledger Cards with Persistence
    const [userCards, setUserCards] = useState(() => {
        try {
            if (!isAuthenticated) return DEFAULT_EMI_CARDS;
            const saved = localStorage.getItem('bb_user_emi_cards');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {
            // fallback
        }
        return DEFAULT_EMI_CARDS;
    });

    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [breakdownSource, setBreakdownSource] = useState('auto'); // 'auto' | 'ledger' | 'calculator'

    // Central Credit Cards State & Synchronization
    const [creditCards, setCreditCards] = useState(() => {
        try {
            if (!isAuthenticated) return [];
            return getUserCreditCards();
        } catch {
            return [];
        }
    });

    const [showAddCcModal, setShowAddCcModal] = useState(false);
    const [editingCc, setEditingCc] = useState(null);
    const [newCcForm, setNewCcForm] = useState(DEFAULT_CC_FORM);
    const [editCcForm, setEditCcForm] = useState(DEFAULT_CC_FORM);
    const [extraSimPayment, setExtraSimPayment] = useState(1000);

    // Clear or reload when authentication status changes
    useEffect(() => {
        if (!isAuthenticated) {
            setUserCards([]);
            setCreditCards([]);
            return;
        }
        setCreditCards(getUserCreditCards());
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            emiCardAPI.getAll().then(res => {
                if (res?.success && Array.isArray(res.data)) {
                    setUserCards(res.data);
                }
            }).catch(err => {
                console.warn('Backend EMI cards fetch failed, using local cache:', err);
            });
        }
    }, [isAuthenticated]);

    // Listen for cross-component user data changes
    useEffect(() => {
        const handleSync = () => {
            if (isAuthenticated) {
                setCreditCards(getUserCreditCards());
            }
        };
        window.addEventListener('userDataChanged', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('userDataChanged', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [isAuthenticated]);

    // Save cards whenever changed (only when authenticated or user actively added)
    useEffect(() => {
        try {
            if (isAuthenticated || userCards.length > 0) {
                localStorage.setItem('bb_user_emi_cards', JSON.stringify(userCards));
            }
        } catch (e) {
            console.warn('Error persisting EMI cards:', e);
        }
    }, [userCards, isAuthenticated]);

    // EMI Calculator Form State (Starts at 0 / empty until user feeds data)
    const [loanAmount, setLoanAmount] = useState(0);
    const [interestRate, setInterestRate] = useState(0);
    const [tenureMonths, setTenureMonths] = useState(0);
    const [loanTitle, setLoanTitle] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('black');
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

    // Due Date Selection for Saving from Calculator
    const [loanDueDay, setLoanDueDay] = useState(5);
    const [showSaveDueModal, setShowSaveDueModal] = useState(false);

    // Edit Modal State for Saved Obligations
    const [editingCard, setEditingCard] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        principal: '',
        amount: '',
        dueDay: 5,
        tenureMonths: 12,
        paidInstallments: 0,
        annualRate: '',
        isZeroInterest: false,
        theme: 'black',
        last4: ''
    });
    const [isEditEmiAutoCalculated, setIsEditEmiAutoCalculated] = useState(true);

    const updateEditFormField = (field, value) => {
        setEditForm(prev => {
            const next = { ...prev, [field]: value };

            if (field === 'isZeroInterest') {
                next.isZeroInterest = value;
                next.annualRate = value ? 0 : (Number(prev.annualRate) > 0 ? prev.annualRate : 10.5);
            } else if (field === 'annualRate') {
                next.annualRate = value;
                next.isZeroInterest = Number(value) === 0;
            }

            if (field === 'principal' || field === 'tenureMonths' || field === 'annualRate' || field === 'isZeroInterest') {
                const p = Number(field === 'principal' ? value : next.principal) || 0;
                const n = Math.max(1, Number(field === 'tenureMonths' ? value : next.tenureMonths) || 1);
                const r = next.isZeroInterest ? 0 : (Number(field === 'annualRate' ? value : next.annualRate) || 0);

                if (p > 0) {
                    const calcEmi = computeStandardEmi(p, r, n);
                    next.amount = String(calcEmi);
                    setIsEditEmiAutoCalculated(true);
                }
            } else if (field === 'amount') {
                setIsEditEmiAutoCalculated(false);
            }

            return next;
        });
    };

    // Modal state for manually adding new loan obligation
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLoanForm, setNewLoanForm] = useState(DEFAULT_NEW_LOAN_FORM);
    const [isEmiAutoCalculated, setIsEmiAutoCalculated] = useState(true);

    const updateNewLoanField = (field, value) => {
        setNewLoanForm(prev => {
            const next = { ...prev, [field]: value };

            if (field === 'isZeroInterest') {
                next.isZeroInterest = value;
                next.annualRate = value ? 0 : (Number(prev.annualRate) > 0 ? prev.annualRate : 10.5);
            } else if (field === 'annualRate') {
                next.annualRate = value;
                next.isZeroInterest = Number(value) === 0;
            }

            if (field === 'principal' || field === 'tenureMonths' || field === 'annualRate' || field === 'isZeroInterest') {
                const p = Number(field === 'principal' ? value : next.principal) || 0;
                const n = Math.max(1, Number(field === 'tenureMonths' ? value : next.tenureMonths) || 1);
                const r = next.isZeroInterest ? 0 : (Number(field === 'annualRate' ? value : next.annualRate) || 0);

                if (p > 0) {
                    const calcEmi = computeStandardEmi(p, r, n);
                    next.amount = String(calcEmi);
                    setIsEmiAutoCalculated(true);
                } else if (!p) {
                    next.amount = '';
                }
            } else if (field === 'amount') {
                setIsEmiAutoCalculated(false);
            }

            return next;
        });
    };

    const handleCategorySelect = (categoryObj) => {
        setNewLoanForm(prev => {
            const isZero = categoryObj.defaultRate === 0;
            const rate = categoryObj.defaultRate;
            const tenure = prev.tenureMonths === DEFAULT_NEW_LOAN_FORM.tenureMonths || !prev.principal ? categoryObj.defaultTenure : prev.tenureMonths;
            const p = Number(prev.principal) || 0;
            const emi = p > 0 ? computeStandardEmi(p, isZero ? 0 : rate, tenure) : prev.amount;

            return {
                ...prev,
                category: categoryObj.id,
                annualRate: rate,
                isZeroInterest: isZero,
                tenureMonths: tenure,
                amount: emi ? String(emi) : prev.amount
            };
        });
    };

    // EMI Math Computation: E = P * r * (1+r)^n / ((1+r)^n - 1)
    // Handles 0% No-Cost EMI cleanly (E = round(P / n), interest = 0)
    const emiCalculation = useMemo(() => {
        const P = Number(loanAmount) || 0;
        const annualRate = Number(interestRate) || 0;
        const n = Number(tenureMonths) || 0;

        if (P <= 0 || n <= 0) {
            return {
                monthlyEmi: 0,
                totalPayment: 0,
                totalInterest: 0,
                principalShare: 0,
                interestShare: 0
            };
        }

        if (annualRate <= 0) {
            const emi = Math.round(P / n);
            const totalPayment = emi * n;
            return {
                monthlyEmi: emi,
                totalPayment,
                totalInterest: 0,
                principalShare: 100,
                interestShare: 0
            };
        }

        const r = annualRate / (12 * 100);
        const factor = Math.pow(1 + r, n);
        const emi = factor > 1 ? Math.round((P * r * factor) / (factor - 1)) : Math.round(P / n);
        const totalPayment = emi * n;
        const totalInterest = Math.max(0, totalPayment - P);
        const principalShare = totalPayment > 0 ? ((P / totalPayment) * 100).toFixed(1) : '0.0';
        const interestShare = totalPayment > 0 ? (100 - Number(principalShare)).toFixed(1) : '0.0';

        return {
            monthlyEmi: emi,
            totalPayment,
            totalInterest,
            principalShare: Number(principalShare),
            interestShare: Number(interestShare)
        };
    }, [loanAmount, interestRate, tenureMonths]);

    // Total active monthly EMI commitments
    const totalMonthlyEmiCommitment = useMemo(() => {
        return userCards.reduce((acc, c) => {
            const raw = typeof c.numericAmount === 'number' 
                ? c.numericAmount 
                : Number(String(c.amount).replace(/[^0-9.]/g, '')) || 0;
            return acc + raw;
        }, 0);
    }, [userCards]);

    // Calculate exact next due date based on monthly payment cycle & settlement status
    const getCardNextDueDate = (cardOrDay) => {
        if (!cardOrDay) return null;
        const card = typeof cardOrDay === 'object' ? cardOrDay : { dueDay: cardOrDay };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = today.getFullYear();
        const month = today.getMonth();
        const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const isPaidThisMonth = card.lastPaidDate === currentMonthKey;
        const totalTenure = Number(card.tenureMonths) || 12;
        const paidCount = Number(card.paidInstallments) || 0;
        const isMatured = paidCount >= totalTenure;

        if (isMatured) {
            return {
                targetDate: null,
                formattedDate: 'Matured / Completed',
                diffDays: 0,
                badge: 'Loan Paid Off',
                badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                isPaidThisMonth: true,
                isMatured: true
            };
        }

        const dueDay = Math.min(31, Math.max(1, Number(card.dueDay) || 1));

        let targetDate;
        if (isPaidThisMonth) {
            // Paid for current month: next cycle is next month on dueDay
            targetDate = new Date(year, month + 1, dueDay);
        } else {
            // Unpaid for current month: check if dueDay has arrived or is pending
            targetDate = new Date(year, month, dueDay);
        }

        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let badge = `Due in ${diffDays} days`;
        let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

        if (isPaidThisMonth) {
            badge = `Next due in ${diffDays} days`;
            badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        } else if (diffDays === 0) {
            badge = 'Due Today!';
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse';
        } else if (diffDays === 1) {
            badge = 'Due Tomorrow';
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
        } else if (diffDays < 0) {
            badge = `Overdue by ${Math.abs(diffDays)} days`;
            badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        }

        return {
            targetDate,
            formattedDate: targetDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            diffDays,
            badge,
            badgeClass,
            isPaidThisMonth,
            isMatured: false
        };
    };

    const getCardDueStatus = (cardOrDay) => getCardNextDueDate(cardOrDay);

    // Trigger Date Confirmation Modal Before Saving
    const handleSaveCalculatedLoan = () => {
        if (emiCalculation.monthlyEmi <= 0) {
            setSaveSuccessMsg('Please enter Loan Principal, Interest Rate, and Tenure first.');
            setTimeout(() => setSaveSuccessMsg(''), 3500);
            return;
        }
        setShowSaveDueModal(true);
    };

    // Confirms and Saves Calculated Loan to Active Ledger with user's selected Due Date
    const handleConfirmSaveCalculatedLoan = (chosenDay) => {
        const dueDayVal = Math.min(31, Math.max(1, parseInt(chosenDay) || loanDueDay || 5));
        const themeConfig = THEME_MAP[selectedTheme] || THEME_MAP.black;
        const cleanLast4 = String(Math.floor(1000 + Math.random() * 9000));

        const newCard = {
            id: Date.now().toString(),
            title: loanTitle.trim() || 'Amortized Loan',
            cardLabel: `${(loanTitle.trim() || 'LOAN').toUpperCase()} LEDGER`,
            dueDay: dueDayVal,
            amount: `${formatCurrency(emiCalculation.monthlyEmi)}`,
            numericAmount: emiCalculation.monthlyEmi,
            latency: 'Auto-Debit Active',
            themeGradient: themeConfig.gradient,
            themeKey: selectedTheme,
            cardNumber: `•••• •••• •••• ${cleanLast4}`,
            cardType: `${(loanTitle.trim() || 'LOAN').toUpperCase()} EMI`,
            holderName: '',
            principal: Number(loanAmount) || 0,
            annualRate: Number(interestRate) || 0,
            tenureMonths: Number(tenureMonths) || 0,
            paidInstallments: 0
        };

        setUserCards(prev => [newCard, ...prev]);
        setActiveCardIndex(0);
        setShowSaveDueModal(false);
        setSaveSuccessMsg(`Saved "${newCard.title}" (Due on Day ${dueDayVal}) to your active EMI ledger!`);
        setTimeout(() => setSaveSuccessMsg(''), 3500);

        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            emiCardAPI.create(newCard).then(res => {
                if (res?.data?.id) {
                    setUserCards(prev => prev.map(c => c.id === newCard.id ? { ...c, id: res.data.id } : c));
                }
            }).catch(err => console.warn('Failed to save card to backend:', err));
        }

        window.dispatchEvent(new Event('userDataChanged'));
    };

    // Open Edit Modal for Saved EMI Obligation
    const handleOpenEditModal = (card) => {
        const rawAmount = card.numericAmount || Number(String(card.amount).replace(/[^0-9.]/g, '')) || 0;
        const tenure = Math.max(1, card.tenureMonths || 12);
        const rate = card.annualRate !== undefined ? card.annualRate : 0;
        const isZero = rate === 0;
        let principalVal = card.principal;
        if (!principalVal || principalVal <= 0) {
            principalVal = isZero 
                ? rawAmount * tenure 
                : Math.round((rawAmount * (1 - Math.pow(1 + (rate / 1200), -tenure))) / (rate / 1200));
        }

        setEditingCard(card);
        setEditForm({
            title: card.title || '',
            principal: principalVal || '',
            amount: rawAmount,
            dueDay: card.dueDay || 5,
            tenureMonths: tenure,
            paidInstallments: card.paidInstallments || 0,
            annualRate: rate,
            isZeroInterest: isZero,
            theme: card.themeKey || 'black',
            last4: card.cardNumber ? card.cardNumber.replace(/\D/g, '').slice(-4) : '7721'
        });
        setIsEditEmiAutoCalculated(true);
    };

    // Save Edited EMI Obligation
    const handleSaveEditModal = (e) => {
        e.preventDefault();
        if (!editingCard || !editForm.title.trim()) return;

        const day = Math.min(31, Math.max(1, parseInt(editForm.dueDay) || 5));
        const tenure = Math.max(1, parseInt(editForm.tenureMonths) || 12);
        const paid = Math.min(tenure, Math.max(0, parseInt(editForm.paidInstallments) || 0));
        const themeConfig = THEME_MAP[editForm.theme] || THEME_MAP.black;
        const cleanLast4 = editForm.last4.replace(/\D/g, '').slice(-4) || '7721';
        const parsedRate = editForm.isZeroInterest || editForm.annualRate === '' || isNaN(Number(editForm.annualRate)) 
            ? 0 
            : Math.max(0, Number(editForm.annualRate));

        let pVal = parseFloat(editForm.principal) || 0;
        let emiVal = parseFloat(editForm.amount) || 0;

        if (emiVal <= 0 && pVal > 0) {
            emiVal = computeStandardEmi(pVal, parsedRate, tenure);
        }
        if (pVal <= 0 && emiVal > 0) {
            if (parsedRate === 0) {
                pVal = emiVal * tenure;
            } else {
                const rMonthly = parsedRate / (12 * 100);
                pVal = Math.round((emiVal * (1 - Math.pow(1 + rMonthly, -tenure))) / rMonthly);
            }
        }
        if (emiVal <= 0) return;

        // Guaranteed zero phantom interest for 0% loans
        let computedPrincipal = pVal;
        if (parsedRate === 0) {
            computedPrincipal = emiVal * tenure;
        }

        const updatedCard = {
            ...editingCard,
            title: editForm.title.trim(),
            cardLabel: `${editForm.title.trim().toUpperCase()} LEDGER`,
            dueDay: day,
            amount: `${formatCurrency(Math.round(emiVal))}`,
            numericAmount: Math.round(emiVal),
            principal: computedPrincipal,
            annualRate: parsedRate,
            themeGradient: themeConfig.gradient,
            themeKey: editForm.theme,
            cardNumber: `•••• •••• •••• ${cleanLast4}`,
            cardType: `${editForm.title.trim().toUpperCase()} EMI`,
            tenureMonths: tenure,
            paidInstallments: paid
        };

        const updatedList = userCards.map(c => c.id === editingCard.id ? updatedCard : c);
        setUserCards(updatedList);
        try {
            localStorage.setItem('bb_user_emi_cards', JSON.stringify(updatedList));
        } catch {}

        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && typeof editingCard.id === 'string' && editingCard.id.length === 24) {
            emiCardAPI.update(editingCard.id, {
                title: updatedCard.title,
                cardLabel: updatedCard.cardLabel,
                dueDay: updatedCard.dueDay,
                amount: updatedCard.amount,
                numericAmount: updatedCard.numericAmount,
                principal: updatedCard.principal,
                annualRate: updatedCard.annualRate,
                themeGradient: updatedCard.themeGradient,
                themeKey: updatedCard.themeKey,
                cardNumber: updatedCard.cardNumber,
                cardType: updatedCard.cardType,
                tenureMonths: updatedCard.tenureMonths,
                paidInstallments: updatedCard.paidInstallments
            }).catch(err => console.warn('Failed to update EMI card on backend:', err));
        }

        window.dispatchEvent(new Event('userDataChanged'));
        setSaveSuccessMsg(`Updated "${updatedCard.title}" in your active EMI ledger!`);
        setTimeout(() => setSaveSuccessMsg(''), 3500);
        setEditingCard(null);
    };

    // Add loan / obligation via modal
    const handleAddModalCard = (e) => {
        e.preventDefault();
        if (!newLoanForm.title.trim()) return;

        const tenure = Math.max(1, parseInt(newLoanForm.tenureMonths) || 12);
        const paid = Math.min(tenure, Math.max(0, parseInt(newLoanForm.paidInstallments) || 0));
        const rate = newLoanForm.isZeroInterest 
            ? 0 
            : (newLoanForm.annualRate === '' || isNaN(Number(newLoanForm.annualRate)) ? 0 : Math.max(0, Number(newLoanForm.annualRate)));
        const dueDay = Math.min(31, Math.max(1, parseInt(newLoanForm.dueDay) || 5));
        const cleanLast4 = newLoanForm.last4.replace(/\D/g, '').slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
        const themeKey = newLoanForm.theme || 'black';
        const themeConfig = THEME_MAP[themeKey] || THEME_MAP.black;

        let pVal = parseFloat(newLoanForm.principal) || 0;
        let emiVal = parseFloat(newLoanForm.amount) || 0;

        if (emiVal <= 0 && pVal > 0) {
            emiVal = computeStandardEmi(pVal, rate, tenure);
        }
        if (pVal <= 0 && emiVal > 0) {
            if (rate === 0) {
                pVal = emiVal * tenure;
            } else {
                const monthlyRate = rate / (12 * 100);
                pVal = Math.round((emiVal * (1 - Math.pow(1 + monthlyRate, -tenure))) / monthlyRate);
            }
        }
        if (emiVal <= 0) return;

        let calculatedPrincipal = pVal;
        if (rate === 0) {
            calculatedPrincipal = emiVal * tenure;
        }

        const newCard = {
            id: Date.now().toString(),
            title: newLoanForm.title.trim(),
            cardLabel: `${newLoanForm.title.trim().toUpperCase()} LEDGER`,
            dueDay: dueDay,
            amount: `${formatCurrency(Math.round(emiVal))}`,
            numericAmount: Math.round(emiVal),
            latency: 'Auto-Debit Active',
            themeGradient: themeConfig.gradient,
            themeKey: themeKey,
            cardNumber: `•••• •••• •••• ${cleanLast4}`,
            cardType: `${(newLoanForm.category || 'LOAN').toUpperCase()} EMI`,
            holderName: user?.name || '',
            principal: calculatedPrincipal,
            annualRate: rate,
            tenureMonths: tenure,
            paidInstallments: paid
        };

        const nextCards = [newCard, ...userCards];
        setUserCards(nextCards);
        setActiveCardIndex(0);
        setShowAddModal(false);
        setNewLoanForm(DEFAULT_NEW_LOAN_FORM);

        try {
            localStorage.setItem('bb_user_emi_cards', JSON.stringify(nextCards));
        } catch (err) {
            console.warn('LocalStorage save failed:', err);
        }

        window.dispatchEvent(new Event('userDataChanged'));
        setSaveSuccessMsg(`Added "${newCard.title}" (Due on Day ${dueDay}) to your active EMI ledger!`);
        setTimeout(() => setSaveSuccessMsg(''), 3500);

        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            emiCardAPI.create(newCard).then(res => {
                if (res?.data?.id) {
                    setUserCards(prev => prev.map(c => c.id === newCard.id ? { ...c, id: res.data.id } : c));
                }
            }).catch(err => console.warn('Failed to save modal card to backend:', err));
        }
    };

    const handleDeleteCard = (id) => {
        setUserCards(prev => {
            const next = prev.filter(c => c.id !== id);
            if (activeCardIndex >= next.length) {
                setActiveCardIndex(Math.max(0, next.length - 1));
            }
            return next;
        });

        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && typeof id === 'string' && id.length === 24) {
            emiCardAPI.delete(id).catch(err => console.warn('Failed to delete card from backend:', err));
        }
    };

    // Card Theme Selector with live sync
    const handleThemeSelect = (themeKey) => {
        setSelectedTheme(themeKey);
        if (currentCard && userCards.length > 0) {
            const themeConfig = THEME_MAP[themeKey];
            if (themeConfig) {
                const updated = userCards.map((c, i) => i === activeCardIndex ? {
                    ...c,
                    themeKey,
                    themeGradient: themeConfig.gradient
                } : c);
                setUserCards(updated);
                const token = localStorage.getItem(TOKEN_STORAGE_KEY);
                if (token && typeof currentCard.id === 'string' && currentCard.id.length === 24) {
                    emiCardAPI.update(currentCard.id, { themeKey, themeGradient: themeConfig.gradient }).catch(e => console.warn(e));
                }
            }
        }
    };

    const handleCardSwitch = (idx) => {
        setActiveCardIndex(idx);
        if (userCards[idx]?.themeKey) {
            setSelectedTheme(userCards[idx].themeKey);
        }
    };

    // Helper to auto-categorize loan types with clear fintech badges
    const getLoanCategoryIcon = (title = '', cardType = '') => {
        const lower = `${title} ${cardType}`.toLowerCase();
        if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle') || lower.includes('auto')) {
            return { icon: '🚗', label: 'Auto / Vehicle', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        if (lower.includes('home') || lower.includes('house') || lower.includes('mortgage') || lower.includes('flat') || lower.includes('plot')) {
            return { icon: '🏠', label: 'Home Loan', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        }
        if (lower.includes('edu') || lower.includes('college') || lower.includes('school') || lower.includes('course') || lower.includes('study')) {
            return { icon: '🎓', label: 'Education', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
        }
        if (lower.includes('tv') || lower.includes('fridge') || lower.includes('phone') || lower.includes('laptop') || lower.includes('mac') || lower.includes('gadget') || lower.includes('ac')) {
            return { icon: '📱', label: 'Consumer Tech', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
        }
        return { icon: '💳', label: 'Personal Loan', badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    };

    // Confirm Monthly Installment Payment with Optional Cashflow Sync
    const handleConfirmMarkPaid = () => {
        if (!payingEmiCard) return;
        const card = payingEmiCard;
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const newPaidCount = (card.paidInstallments || 0) + 1;
        const totalTenure = card.tenureMonths || 12;
        const emiVal = Number(typeof card.numericAmount === 'number' ? card.numericAmount : String(card.amount || '').replace(/[^0-9.]/g, '') || 0);

        let createdTxId = '';
        if (logToCashflow && emiVal > 0) {
            createdTxId = `tx-user-emi-${card.id}-${Date.now()}`;
            addUserTransaction({
                id: createdTxId,
                title: `${card.title} EMI Installment`,
                amount: emiVal,
                category: 'EMI & Loans',
                type: 'expense',
                date: today.toISOString().split('T')[0]
            });
        }

        // Update card in state and localStorage
        const updatedCards = userCards.map(c => {
            if (c.id === card.id) {
                return {
                    ...c,
                    paidInstallments: newPaidCount,
                    lastPaidDate: currentMonthKey,
                    lastTxId: createdTxId || c.lastTxId || ''
                };
            }
            return c;
        });

        setUserCards(updatedCards);
        try {
            localStorage.setItem('bb_user_emi_cards', JSON.stringify(updatedCards));
        } catch {}

        // Update card in MongoDB Atlas via backend API if logged in
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && typeof card.id === 'string' && card.id.length === 24) {
            emiCardAPI.update(card.id, {
                paidInstallments: newPaidCount,
                lastPaidDate: currentMonthKey
            }).catch(err => console.warn('Failed to update EMI installment on backend:', err));
        }

        window.dispatchEvent(new Event('userDataChanged'));

        setPayingEmiCard(null);
        setSaveSuccessMsg(
            logToCashflow
                ? `Settled installment ${newPaidCount}/${totalTenure} & recorded ${formatCurrency(emiVal)} under "EMI & Loans"!`
                : `Marked installment ${newPaidCount} of ${totalTenure} paid on loan ledger.`
        );
        setTimeout(() => setSaveSuccessMsg(''), 4500);
    };

    // Revert Monthly Installment to Unpaid
    const handleMarkInstallmentUnpaid = (card) => {
        const newPaidCount = Math.max(0, (card.paidInstallments || 1) - 1);

        // If an associated cashflow expense was recorded for this installment, remove it
        if (card.lastTxId) {
            deleteUserTransaction(card.lastTxId);
        }

        // Revert card payment status in state & localStorage
        const updatedCards = userCards.map(c => {
            if (c.id === card.id) {
                return {
                    ...c,
                    paidInstallments: newPaidCount,
                    lastPaidDate: '', // Resets to unpaid for this billing cycle!
                    lastTxId: ''
                };
            }
            return c;
        });

        setUserCards(updatedCards);
        try {
            localStorage.setItem('bb_user_emi_cards', JSON.stringify(updatedCards));
        } catch {}

        // Revert on MongoDB Atlas backend
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && typeof card.id === 'string' && card.id.length === 24) {
            emiCardAPI.update(card.id, {
                paidInstallments: newPaidCount,
                lastPaidDate: ''
            }).catch(err => console.warn('Failed to revert EMI installment on backend:', err));
        }

        window.dispatchEvent(new Event('userDataChanged'));
        setSaveSuccessMsg(`Reverted "${card.title}" to Unpaid for this billing cycle.`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
    };

    // Central User Budget Sync for DTI (Debt-to-Income) Telemetry
    const [userBudget, setUserBudget] = useState(() => getUserBudget());

    useEffect(() => {
        const handleSyncBudget = () => {
            setUserBudget(getUserBudget());
        };
        window.addEventListener('userDataChanged', handleSyncBudget);
        window.addEventListener('storage', handleSyncBudget);
        return () => {
            window.removeEventListener('userDataChanged', handleSyncBudget);
            window.removeEventListener('storage', handleSyncBudget);
        };
    }, []);

    const currentCard = userCards[activeCardIndex] || userCards[0];
    const cardStatus = currentCard ? getCardNextDueDate(currentCard) : null;

    // Global Earliest Next Due Cycle Telemetry across all userCards
    const earliestNextDue = useMemo(() => {
        if (!userCards || userCards.length === 0) return null;

        const activeUnmatured = userCards
            .map(card => ({
                card,
                due: getCardNextDueDate(card)
            }))
            .filter(item => item.due && !item.due.isMatured && item.due.targetDate);

        if (activeUnmatured.length === 0) {
            return {
                title: 'All Obligations Settled',
                formattedDate: 'None Pending',
                badge: 'Debt Free',
                badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                isPaidThisMonth: true
            };
        }

        // Sort by targetDate ascending (earliest upcoming due first)
        activeUnmatured.sort((a, b) => a.due.targetDate.getTime() - b.due.targetDate.getTime());

        const next = activeUnmatured[0];
        return {
            title: next.card.title,
            formattedDate: next.due.formattedDate,
            badge: next.due.badge,
            badgeClass: next.due.badgeClass,
            isPaidThisMonth: next.due.isPaidThisMonth,
            dueDay: next.card.dueDay
        };
    }, [userCards]);

    // Centrally computed Health Score Pillar 4 points (max 20 pts)
    const healthBreakdown = useMemo(() => {
        const summary = {
            totalIncome: Number(userBudget?.monthlyIncome || 0),
            totalExpense: 0,
            netSavings: Number(userBudget?.monthlyIncome || 0)
        };
        return calculateHealthBreakdown(summary, {}, 0, userCards);
    }, [userBudget?.monthlyIncome, userCards]);

    const dtiScorePoints = healthBreakdown?.pillars?.debt?.points || 0;

    // Industry Standard DTI (Debt-to-Income) Burden Telemetry
    const dtiMetrics = useMemo(() => {
        const income = Number(userBudget?.monthlyIncome || 0);
        const debt = totalMonthlyEmiCommitment;
        if (income <= 0) {
            return {
                percentage: '0.0',
                hasIncome: false,
                annualDebt: debt * 12,
                status: debt > 0 ? 'Income Not Set' : 'Zero Debt',
                badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                label: debt > 0 ? 'Set monthly income in Budget for DTI ratio' : 'No active debt commitments registered'
            };
        }

        const pct = (debt / income) * 100;
        let status = 'Low Risk (<20%)';
        let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let label = 'Healthy debt profile within RBI standard guidelines';

        if (pct > 35) {
            status = 'High Burden (>35%)';
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            label = 'High debt exposure; avoid new discretionary borrowings';
        } else if (pct >= 20) {
            status = 'Moderate (20-35%)';
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            label = 'Acceptable debt load; monitor additional recurring commitments';
        }

        return {
            percentage: pct.toFixed(1),
            hasIncome: true,
            annualDebt: debt * 12,
            status,
            badgeClass,
            label
        };
    }, [userBudget?.monthlyIncome, totalMonthlyEmiCommitment]);

    // Repayment & Payoff Intelligence (Option 1: Interactive Amortization Analysis)
    const activeLoanAnalysis = useMemo(() => {
        const extraPerMonth = Math.max(100, Number(extraSimPayment) || 1000);

        // Determine whether to inspect the live calculator or a ledger card:
        const isCalculatorActive = breakdownSource === 'calculator'
            ? (loanAmount > 0 && tenureMonths > 0)
            : (breakdownSource === 'ledger'
                ? false
                : (userCards.length === 0 && loanAmount > 0 && interestRate > 0 && tenureMonths > 0));

        // Priority 1: Current Live Calculator Simulation (when in calculator mode)
        if (isCalculatorActive) {
            const P = Number(loanAmount);
            const rAnnual = Number(interestRate);
            const n = Number(tenureMonths);
            const emi = emiCalculation.monthlyEmi;
            const totalInterest = emiCalculation.totalInterest;
            const totalLifetimeCost = P + totalInterest;
            const principalShare = Math.min(100, Math.max(0, Number(emiCalculation.principalShare)));
            const interestShare = Number((100 - principalShare).toFixed(1));
            const interestRatio = P > 0 ? ((totalInterest / P) * 100).toFixed(1) : '0.0';

            const maturity = new Date();
            maturity.setMonth(maturity.getMonth() + n);
            const maturityDate = maturity.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

            // Exact month-by-month prepayment simulation
            let monthsSaved = 0;
            let interestSaved = 0;
            let payoffMonths = n;

            if (rAnnual > 0 && totalInterest > 0) {
                const rMonthly = (rAnnual / 100) / 12;
                const newMonthlyPayment = emi + extraPerMonth;
                let balance = P;
                let simulatedInterest = 0;
                let m = 0;
                while (balance > 1 && m < n) {
                    m++;
                    const monthInterest = balance * rMonthly;
                    simulatedInterest += monthInterest;
                    const principalPayment = Math.min(balance, newMonthlyPayment - monthInterest);
                    balance -= principalPayment;
                }
                payoffMonths = m;
                monthsSaved = Math.max(0, n - payoffMonths);
                interestSaved = Math.max(0, Math.round(totalInterest - simulatedInterest));
            } else {
                const newMonthlyPayment = emi + extraPerMonth;
                payoffMonths = Math.max(1, Math.ceil(totalLifetimeCost / newMonthlyPayment));
                monthsSaved = Math.max(0, n - payoffMonths);
                interestSaved = 0;
            }

            let prepaymentTip = '';
            if (totalInterest === 0 || rAnnual === 0) {
                if (monthsSaved > 0) {
                    prepaymentTip = `Zero-Interest Loan: Prepaying an extra ${formatCurrency(extraPerMonth)}/mo clears this loan in ${payoffMonths} months instead of ${n} (finishes ${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier). 100% of extra cash clears principal immediately with zero interest drag.`;
                } else {
                    prepaymentTip = `Maintaining steady on-time auto-debits ensures this 0% interest loan matures debt-free on schedule with zero penalties.`;
                }
            } else {
                if (monthsSaved > 0 && interestSaved > 0) {
                    prepaymentTip = `Prepaying an extra ${formatCurrency(extraPerMonth)}/mo closes this loan in ${payoffMonths} months (${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier), saving ~${formatCurrency(interestSaved)} in total compounding interest.`;
                } else if (monthsSaved > 0) {
                    prepaymentTip = `Prepaying an extra ${formatCurrency(extraPerMonth)}/mo clears this loan in ${payoffMonths} months (${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier), shortening your debt commitment.`;
                } else {
                    prepaymentTip = `Consistent monthly payments keep this obligation on track toward the ${maturityDate} maturity target.`;
                }
            }

            return {
                isActive: true,
                isSimulated: true,
                hasCard: false,
                targetCard: null,
                cardIndex: 0,
                title: loanTitle.trim() || 'Calculated Loan Model',
                principal: P,
                tenureMonths: n,
                annualRate: rAnnual,
                monthlyEmi: emi,
                totalInterest,
                totalLifetimeCost,
                principalShare,
                interestShare,
                interestRatio,
                maturityDate: `${maturityDate} (${n} Mos)`,
                prepaymentAmount: extraPerMonth,
                monthsSaved,
                interestSaved,
                prepaymentTip
            };
        }

        // Priority 2: Active Card Selected from Ledger (userCards[activeCardIndex])
        const targetCard = userCards[activeCardIndex] || userCards[0];
        if (targetCard && (Number(targetCard.numericAmount) > 0 || Number(targetCard.principal) > 0)) {
            const emi = Number(targetCard.numericAmount) || 0;
            const n = Math.max(1, Number(targetCard.tenureMonths) || 12);
            const totalPayment = emi * n;
            const rAnnual = typeof targetCard.annualRate === 'number' ? targetCard.annualRate : 0;
            let P = Number(targetCard.principal) || 0;

            // Mathematical consistency guarantee: Principal can NEVER exceed total payments
            if (P <= 0 || P >= totalPayment) {
                if (rAnnual > 0) {
                    const rMonthly = (rAnnual / 100) / 12;
                    const pv = emi * (1 - Math.pow(1 + rMonthly, -n)) / rMonthly;
                    P = Math.round(Math.min(totalPayment * 0.99, Math.max(1, pv)));
                } else {
                    P = totalPayment; // 0% No-Cost EMI
                }
            }

            const totalInterest = Math.max(0, totalPayment - P);
            const principalShare = totalPayment > 0 
                ? Number(Math.min(100, Math.max(0, (P / totalPayment) * 100)).toFixed(1)) 
                : 100;
            const interestShare = Number(Math.max(0, 100 - principalShare).toFixed(1));
            const interestRatio = P > 0 ? ((totalInterest / P) * 100).toFixed(1) : '0.0';

            const maturity = new Date();
            maturity.setMonth(maturity.getMonth() + n);
            const maturityDate = maturity.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

            // Exact month-by-month prepayment simulation
            let monthsSaved = 0;
            let interestSaved = 0;
            let payoffMonths = n;

            if (rAnnual > 0 && totalInterest > 0) {
                const rMonthly = (rAnnual / 100) / 12;
                const newMonthlyPayment = emi + extraPerMonth;
                let balance = P;
                let simulatedInterest = 0;
                let m = 0;
                while (balance > 1 && m < n) {
                    m++;
                    const monthInterest = balance * rMonthly;
                    simulatedInterest += monthInterest;
                    const principalPayment = Math.min(balance, newMonthlyPayment - monthInterest);
                    balance -= principalPayment;
                }
                payoffMonths = m;
                monthsSaved = Math.max(0, n - payoffMonths);
                interestSaved = Math.max(0, Math.round(totalInterest - simulatedInterest));
            } else {
                // True 0% No-Cost EMI
                const newMonthlyPayment = emi + extraPerMonth;
                payoffMonths = Math.max(1, Math.ceil(totalPayment / newMonthlyPayment));
                monthsSaved = Math.max(0, n - payoffMonths);
                interestSaved = 0;
            }

            let prepaymentTip = '';
            if (totalInterest === 0 || rAnnual === 0) {
                if (monthsSaved > 0) {
                    prepaymentTip = `Zero-Interest Loan: Prepaying an extra ${formatCurrency(extraPerMonth)}/mo clears this loan in ${payoffMonths} months instead of ${n} (finishes ${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier). 100% of your prepayment directly clears principal with zero interest drag.`;
                } else {
                    prepaymentTip = `Maintaining on-time auto-debits ensures this 0% interest loan matures debt-free on schedule with zero penalties.`;
                }
            } else {
                if (monthsSaved > 0 && interestSaved > 0) {
                    prepaymentTip = `Prepaying an extra ${formatCurrency(extraPerMonth)}/mo closes this loan in ${payoffMonths} months (${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier), saving ~${formatCurrency(interestSaved)} in total compounding interest.`;
                } else if (monthsSaved > 0) {
                    prepaymentTip = `Prepaying an extra ${formatCurrency(extraPerMonth)}/mo clears this loan in ${payoffMonths} months (${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier), shortening your debt commitment.`;
                } else {
                    prepaymentTip = `Consistent monthly payments keep this obligation on track toward the ${maturityDate} maturity target.`;
                }
            }

            return {
                isActive: true,
                isSimulated: false,
                hasCard: true,
                targetCard,
                cardIndex: activeCardIndex,
                title: targetCard.title || 'Active EMI Commitment',
                principal: P,
                tenureMonths: n,
                annualRate: rAnnual,
                monthlyEmi: emi,
                totalInterest,
                totalLifetimeCost: totalPayment,
                principalShare,
                interestShare,
                interestRatio,
                maturityDate: `${maturityDate} (${n} Mos)`,
                prepaymentAmount: extraPerMonth,
                monthsSaved,
                interestSaved,
                prepaymentTip
            };
        }

        // Zero State
        return {
            isActive: false,
            isSimulated: false,
            hasCard: false,
            targetCard: null,
            cardIndex: 0,
            title: '',
            principal: 0,
            tenureMonths: 0,
            annualRate: 0,
            monthlyEmi: 0,
            totalInterest: 0,
            principalShare: 0,
            interestShare: 0,
            interestRatio: '0.0',
            maturityDate: 'N/A',
            prepaymentAmount: 0,
            monthsSaved: 0,
            interestSaved: 0,
            prepaymentTip: ''
        };
    }, [loanAmount, interestRate, tenureMonths, loanTitle, emiCalculation, extraSimPayment, breakdownSource, activeCardIndex, userCards]);

    // Central Credit Cards Telemetry Computations
    const ccMetrics = useMemo(() => {
        const totalLimit = creditCards.reduce((acc, c) => acc + (Number(c.creditLimit) || 0), 0);
        const totalBalance = creditCards.reduce((acc, c) => acc + (Number(c.currentBalance) || 0), 0);
        const availableCredit = Math.max(0, totalLimit - totalBalance);
        const utilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

        let status = 'Zero Utilization';
        let badgeClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
        let tip = 'No active balance reported.';

        if (totalLimit > 0) {
            if (utilization <= 30) {
                status = 'Optimal (<30%)';
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                tip = 'Excellent credit utilization. Safely protects and boosts your CIBIL score.';
            } else if (utilization <= 50) {
                status = 'Moderate (30-50%)';
                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                tip = 'Borderline utilization. Recommended to pay down balance below 30% before statement.';
            } else {
                status = 'High Risk (>50%)';
                badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                tip = 'Heavy credit burn. High utilization directly suppresses your credit rating.';
            }
        }

        return {
            totalLimit,
            totalBalance,
            availableCredit,
            utilization: utilization.toFixed(1),
            numericUtilization: utilization,
            status,
            badgeClass,
            tip
        };
    }, [creditCards]);

    // Credit Card Due Status Calculator
    const getCreditCardDueStatus = (card) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = today.getFullYear();
        const month = today.getMonth();
        const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        // A card is only marked paid for this cycle if explicitly recorded as paid for this month!
        const isPaidThisMonth = Boolean(card.lastPaidDate && card.lastPaidDate === currentMonthKey);

        const dueDay = Math.min(31, Math.max(1, Number(card.dueDay) || 5));
        const targetDate = new Date(year, month, dueDay);
        if (targetDate < today) {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }

        const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        let badge = `Due in ${diffDays}d`;
        let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

        if (isPaidThisMonth) {
            badge = 'Settled ✓';
            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (Number(card.currentBalance) <= 0) {
            badge = 'Zero Due';
            badgeClass = 'bg-zinc-100 text-zinc-600 border-zinc-200';
        } else if (diffDays === 0) {
            badge = 'Due Today!';
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse';
        } else if (diffDays === 1) {
            badge = 'Due Tomorrow';
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
        } else if (diffDays < 0) {
            badge = `Overdue by ${Math.abs(diffDays)}d`;
            badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        }

        return {
            targetDate,
            formattedDate: targetDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            diffDays,
            badge,
            badgeClass,
            isPaidThisMonth
        };
    };

    // Mark Credit Card Bill as Settled for this cycle (Dependency Settlement, NOT Cash Minus)
    const handleMarkCreditCardPaid = (card) => {
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const activeBalance = Number(card.currentBalance) || 0;
        const fallbackAmount = Number(card.previousBalance) || Math.round((Number(card.creditLimit) || 16000) * 0.25) || 4000;
        const billAmount = activeBalance > 0 ? activeBalance : fallbackAmount;

        const updated = updateUserCreditCard(card.id, {
            currentBalance: 0,
            previousBalance: billAmount,
            lastPaidDate: currentMonthKey
        });
        setCreditCards(updated);
        window.dispatchEvent(new Event('userDataChanged'));

        setSaveSuccessMsg(`Statement balance of ${formatCurrency(billAmount)} for ${card.bankName} ${card.cardName} settled for this cycle.`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
    };

    // Revert Credit Card Bill to Unpaid (Restores previous statement balance)
    const handleMarkCreditCardUnpaid = (card) => {
        const restoreAmt = Number(card.previousBalance) > 0 
            ? Number(card.previousBalance) 
            : (Number(card.creditLimit) > 0 ? Math.round(Number(card.creditLimit) * 0.25) : 4000);

        const updated = updateUserCreditCard(card.id, {
            currentBalance: restoreAmt,
            previousBalance: restoreAmt,
            lastPaidDate: ''
        });
        setCreditCards(updated);
        window.dispatchEvent(new Event('userDataChanged'));

        setSaveSuccessMsg(`Reverted "${card.cardName}" to Unpaid (${formatCurrency(restoreAmt)} due restored).`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
    };

    // Add Credit Card Form Submit
    const handleAddCreditCard = (e) => {
        e.preventDefault();
        if (!newCcForm.cardName.trim() || !newCcForm.creditLimit) return;

        const chosenBank = (newCcForm.bankName === 'Other Bank' && newCcForm.customBankName?.trim())
            ? newCcForm.customBankName.trim()
            : (newCcForm.bankName.trim() || 'HDFC Bank');

        const initBalance = Number(newCcForm.currentBalance) || 0;
        const created = addUserCreditCard({
            cardName: newCcForm.cardName.trim(),
            bankName: chosenBank,
            network: newCcForm.network || 'Visa',
            creditLimit: Number(newCcForm.creditLimit) || 0,
            currentBalance: initBalance,
            previousBalance: initBalance,
            statementDay: Number(newCcForm.statementDay) || 15,
            dueDay: Number(newCcForm.dueDay) || 5,
            last4: newCcForm.last4.replace(/\D/g, '').slice(-4) || '4821',
            holderName: newCcForm.holderName.trim() || '',
            themeKey: newCcForm.themeKey || 'black',
            lastPaidDate: ''
        });

        setCreditCards(getUserCreditCards());
        setShowAddCcModal(false);
        setNewCcForm(DEFAULT_CC_FORM);
        setSaveSuccessMsg(`Added "${created.bankName} ${created.cardName}" to Credit Cards Center!`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
    };

    // Open Edit Credit Card
    const handleOpenEditCc = (card) => {
        const isPreset = BANK_PRESETS.includes(card.bankName) && card.bankName !== 'Other Bank';
        setEditingCc(card);
        setEditCcForm({
            cardName: card.cardName || '',
            bankName: isPreset ? card.bankName : 'Other Bank',
            customBankName: isPreset ? '' : (card.bankName || ''),
            network: card.network || 'Visa',
            creditLimit: card.creditLimit || '',
            currentBalance: card.currentBalance || 0,
            statementDay: card.statementDay || 15,
            dueDay: card.dueDay || 5,
            last4: card.last4 || '4821',
            holderName: card.holderName || '',
            themeKey: card.themeKey || 'black'
        });
    };

    // Save Edit Credit Card
    const handleSaveEditCc = (e) => {
        e.preventDefault();
        if (!editingCc || !editCcForm.cardName.trim() || !editCcForm.creditLimit) return;

        const chosenBank = (editCcForm.bankName === 'Other Bank' && editCcForm.customBankName?.trim())
            ? editCcForm.customBankName.trim()
            : (editCcForm.bankName.trim() || 'HDFC Bank');

        const newBalance = Number(editCcForm.currentBalance) || 0;
        const updated = updateUserCreditCard(editingCc.id, {
            cardName: editCcForm.cardName.trim(),
            bankName: chosenBank,
            network: editCcForm.network || 'Visa',
            creditLimit: Number(editCcForm.creditLimit) || 0,
            currentBalance: newBalance,
            previousBalance: newBalance > 0 ? newBalance : (editingCc.previousBalance || 0),
            statementDay: Number(editCcForm.statementDay) || 15,
            dueDay: Number(editCcForm.dueDay) || 5,
            last4: editCcForm.last4.replace(/\D/g, '').slice(-4) || '4821',
            holderName: editCcForm.holderName.trim() || '',
            themeKey: editCcForm.themeKey || 'black'
        });

        setCreditCards(updated);
        setEditingCc(null);
        setSaveSuccessMsg(`Updated "${editCcForm.cardName}" details!`);
        setTimeout(() => setSaveSuccessMsg(''), 3500);
    };

    // Delete Credit Card
    const handleDeleteCc = (card) => {
        if (!card) return;
        const updated = deleteUserCreditCard(card.id);
        setCreditCards(updated);
        setSaveSuccessMsg(`Removed "${card.cardName}" from credit card tracker.`);
        setTimeout(() => setSaveSuccessMsg(''), 3500);
    };

    return (
        <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean">
            <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} />

            <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="pb-8 border-b border-[#1A1A1A]/10 mb-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
                                FINANCIAL TELEMETRY / DEBT & REVOLVING CREDIT SUITE
                            </span>
                            <h1 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
                                {activeStudioTab === 'loans' ? (
                                    <>LOANS & AMORTIZATION <span className="italic text-[#088fff]">STUDIO</span></>
                                ) : (
                                    <>CREDIT CARDS & REVOLVING <span className="italic text-[#088fff]">CREDIT</span></>
                                )}
                            </h1>
                            <p className="mt-3 text-sm sm:text-base text-[#1A1A1A]/70 max-w-2xl font-light">
                                {activeStudioTab === 'loans'
                                    ? 'Model loan amortizations, calculate interest splits, simulate early payoff savings, and manage monthly recurring loan due dates.'
                                    : 'Manage revolving credit lines, track statement billing cycles and payment due dates, and monitor credit card utilization ratios to protect your credit score.'
                                }
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {activeStudioTab === 'loans' ? (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-5 rounded-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add New Loan</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowAddCcModal(true)}
                                    className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-5 rounded-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Credit Card</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Primary Two-Tab Switcher */}
                    <div className="flex items-center gap-2 bg-[#F9F8F5] p-1.5 rounded-sm border border-[#1A1A1A]/10 w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveStudioTab('loans')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                activeStudioTab === 'loans'
                                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                                    : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-white'
                            }`}
                        >
                            <Calculator className="w-4 h-4 text-[#088fff]" />
                            <span>Loans & Amortization</span>
                            {userCards.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    activeStudioTab === 'loans' ? 'bg-white/20 text-white' : 'bg-[#1A1A1A]/10 text-[#1A1A1A]'
                                }`}>
                                    {userCards.length}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStudioTab('cards')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                activeStudioTab === 'cards'
                                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                                    : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-white'
                            }`}
                        >
                            <CreditCard className="w-4 h-4 text-[#088fff]" />
                            <span>Credit Cards Center</span>
                            {creditCards.length > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                    activeStudioTab === 'cards' ? 'bg-[#088fff] text-white' : 'bg-[#1A1A1A]/10 text-[#1A1A1A]'
                                }`}>
                                    {creditCards.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Dynamic Top Metrics Row (Loans vs Credit Cards) */}
                {activeStudioTab === 'loans' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {/* Card 1: Active Debt Commitments */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                    ACTIVE DEBT COMMITMENTS
                                </span>
                                <CreditCard className="w-4 h-4 text-[#088fff]" />
                            </div>
                            <div className="text-3xl font-editorial font-bold text-[#1A1A1A]">
                                {userCards.length} <span className="text-sm font-sans-clean font-normal text-[#1A1A1A]/60">{userCards.length === 1 ? 'Active Loan' : 'Active Loans'}</span>
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
                                {userCards.length > 0 ? `${userCards.length} auto-debit accounts linked` : 'No active debts registered'}
                            </div>
                        </div>

                        {/* Card 2: Monthly Recurring Outflow */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                    MONTHLY RECURRING OUTFLOW
                                </span>
                                <TrendingUp className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="text-3xl font-editorial font-bold text-amber-600">
                                {formatCurrency(totalMonthlyEmiCommitment)}
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
                                Annualized: {formatCurrency(totalMonthlyEmiCommitment * 12)}/yr
                            </div>
                        </div>

                        {/* Card 3: Next Due Date */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                    NEXT DUE CYCLE
                                </span>
                                <Calendar className="w-4 h-4 text-[#088fff]" />
                            </div>
                            <div className="text-xl font-editorial font-bold text-[#1A1A1A] flex items-center gap-2 mt-1 flex-wrap">
                                <span>{earliestNextDue?.formattedDate || 'None Pending'}</span>
                                {earliestNextDue && (
                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${earliestNextDue.badgeClass}`}>
                                        {earliestNextDue.badge}
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1 truncate">
                                {earliestNextDue ? `Next: ${earliestNextDue.title}` : 'All obligations settled'}
                            </div>
                        </div>

                        {/* Card 4: DEBT-TO-INCOME (DTI) BURDEN (Interactive Explainer) */}
                        <div 
                            onClick={() => setShowDtiModal(true)}
                            className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm hover:border-[#088fff] hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
                            title="Click to view DTI calculation formula, breakdown, and Health Score impact"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                        DEBT-TO-INCOME (DTI) BURDEN
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-mono text-[#088fff] font-bold group-hover:underline">
                                            Score Impact →
                                        </span>
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="text-3xl font-editorial font-bold text-[#1A1A1A] flex items-center gap-2 mt-1">
                                    {dtiMetrics.hasIncome ? (
                                        <>
                                            <span>{dtiMetrics.percentage}%</span>
                                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${dtiMetrics.badgeClass}`}>
                                                {dtiMetrics.status}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-sans-clean font-medium text-[#1A1A1A]/70">
                                            {totalMonthlyEmiCommitment > 0 ? `${formatCurrency(totalMonthlyEmiCommitment * 12)}/yr` : '0.0%'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/70 mt-2.5 pt-2 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                                <span>Health Pillar 4: <strong className="text-[#088fff] font-bold">{dtiScorePoints} / 20 pts</strong></span>
                                <span className="text-[10px] font-bold text-[#088fff] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                    <span>Inspect</span>
                                    <span>→</span>
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {/* CC Card 1: Total Approved Credit Line */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                    TOTAL APPROVED CREDIT LINE
                                </span>
                                <CreditCard className="w-4 h-4 text-[#088fff]" />
                            </div>
                            <div className="text-3xl font-editorial font-bold text-[#1A1A1A]">
                                {formatCurrency(ccMetrics.totalLimit)}
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
                                Across {creditCards.length} {creditCards.length === 1 ? 'active credit card' : 'active credit cards'}
                            </div>
                        </div>

                        {/* CC Card 2: Current Outstanding Balance */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                    OUTSTANDING STATEMENT DUE
                                </span>
                                <TrendingUp className="w-4 h-4 text-rose-600" />
                            </div>
                            <div className="text-3xl font-editorial font-bold text-rose-600">
                                {formatCurrency(ccMetrics.totalBalance)}
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
                                Total active cycle balance due
                            </div>
                        </div>

                        {/* CC Card 3: Total Available Credit */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                    AVAILABLE REVOLVING CREDIT
                                </span>
                                <Wallet className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="text-3xl font-editorial font-bold text-emerald-600">
                                {formatCurrency(ccMetrics.availableCredit)}
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-1">
                                Immediate liquidity bandwidth
                            </div>
                        </div>

                        {/* CC Card 4: Credit Utilization Ratio (%) */}
                        <div className="bg-white p-6 rounded-sm border border-[#1A1A1A]/15 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#1A1A1A]/50">
                                        CREDIT UTILIZATION RATIO
                                    </span>
                                    <Percent className="w-4 h-4 text-[#088fff]" />
                                </div>
                                <div className="text-3xl font-editorial font-bold text-[#1A1A1A] flex items-center gap-2 mt-1">
                                    <span>{ccMetrics.utilization}%</span>
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${ccMetrics.badgeClass}`}>
                                        {ccMetrics.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[11px] font-mono text-[#1A1A1A]/60 mt-2.5 pt-2 border-t border-[#1A1A1A]/10">
                                Benchmark: Keep under 30% for high CIBIL score
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVE WORKSPACE SWITCHER: LOANS & AMORTIZATION vs CREDIT CARDS CENTER */}
                {activeStudioTab === 'loans' ? (
                    <>
                        {/* TWO-COLUMN WORKSPACE: LOAN CALCULATOR (LEFT) & AMORTIZATION INTELLIGENCE (RIGHT) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
                    
                    {/* LEFT COLUMN: INTERACTIVE LOAN CALCULATOR */}
                    <div className="lg:col-span-7 bg-white rounded-sm border border-[#1A1A1A]/15 p-6 sm:p-7 shadow-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3.5 border-b border-[#1A1A1A]/10 mb-5">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-[#088fff]" />
                                    <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">
                                        INTERACTIVE LOAN AMORTIZATION CALCULATOR
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-[#088fff] font-bold hidden sm:inline">Standard Indian Banking Formula</span>
                                    {(loanAmount > 0 || interestRate > 0 || tenureMonths > 0 || loanTitle.trim()) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLoanAmount(0);
                                                setInterestRate(0);
                                                setTenureMonths(0);
                                                setLoanTitle('');
                                            }}
                                            className="text-[10px] font-mono font-bold text-[#1A1A1A]/50 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Reset calculator inputs to baseline zero"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {saveSuccessMsg && (
                                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono rounded flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{saveSuccessMsg}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Loan Purpose / Title */}
                                <div>
                                    <label className="flex justify-between items-center text-xs font-bold font-mono uppercase text-[#1A1A1A]/70 mb-1.5">
                                        <span>Loan Purpose / Name</span>
                                        <span className="text-[10px] text-[#1A1A1A]/40 font-normal">e.g. Car Loan, Education, Gadget</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={loanTitle}
                                        onChange={(e) => setLoanTitle(e.target.value)}
                                        placeholder="Enter Loan Name (e.g. Car Loan, Education, Home Loan)"
                                        className="w-full px-3.5 py-2 bg-[#F9F8F5] border border-[#1A1A1A]/20 focus:border-[#088fff] focus:bg-white rounded-sm text-sm outline-none transition-all font-sans-clean font-medium"
                                    />
                                    {/* Quick Purpose Presets */}
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {[
                                            { name: 'Vehicle Loan', icon: '🚗', defaultRate: 9.5, defaultTenure: 36 },
                                            { name: 'Gadget EMI', icon: '📱', defaultRate: 12.0, defaultTenure: 12 },
                                            { name: 'Home Renovation', icon: '🏠', defaultRate: 8.75, defaultTenure: 60 },
                                            { name: 'Education Loan', icon: '🎓', defaultRate: 10.0, defaultTenure: 48 },
                                            { name: 'Personal Loan', icon: '💳', defaultRate: 13.5, defaultTenure: 24 }
                                        ].map(cat => (
                                            <button
                                                key={cat.name}
                                                type="button"
                                                onClick={() => {
                                                    setLoanTitle(cat.name);
                                                    if (interestRate === 0) setInterestRate(cat.defaultRate);
                                                    if (tenureMonths === 0) setTenureMonths(cat.defaultTenure);
                                                }}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                    loanTitle === cat.name
                                                        ? 'bg-[#1A1A1A] text-white shadow-xs'
                                                        : 'bg-[#F9F8F5] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/10'
                                                }`}
                                            >
                                                <span>{cat.icon}</span>
                                                <span>{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Slider 1: Principal Amount */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold font-mono uppercase text-[#1A1A1A]/70">
                                            Principal Loan Amount
                                        </span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-sm bg-[#F9F8F5] px-2.5 py-0.5 border border-[#1A1A1A]/15 rounded-sm">
                                            <span>{symbol}</span>
                                            <input
                                                type="number"
                                                value={loanAmount === 0 ? '' : loanAmount}
                                                placeholder="0"
                                                onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value) || 0))}
                                                className="w-24 bg-transparent outline-none text-right font-mono font-bold text-[#1A1A1A]"
                                                min="0"
                                                max="10000000"
                                                step="10000"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5000000"
                                        step="10000"
                                        value={loanAmount}
                                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                                        className="w-full accent-[#088fff] cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-mono text-[#1A1A1A]/40 mt-0.5">
                                        <span>{formatCurrency(0)}</span>
                                        <span>{formatCompact(2500000)}</span>
                                        <span>{formatCompact(5000000)}</span>
                                    </div>
                                    {/* Quick Amount Presets */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                        {[50000, 100000, 250000, 500000, 1000000].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setLoanAmount(amt)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                                    loanAmount === amt 
                                                        ? 'bg-[#088fff] text-white shadow-xs' 
                                                        : 'bg-[#F9F8F5] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/10'
                                                }`}
                                            >
                                                {formatCompact(amt)}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setLoanAmount(prev => Math.min(5000000, (Number(prev) || 0) + 50000))}
                                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F9F8F5] text-[#088fff] hover:bg-[#088fff]/10 border border-[#088fff]/30 transition-all cursor-pointer ml-auto"
                                            title={`Add ${formatCurrency(50000)} to current amount`}
                                        >
                                            +{formatCompact(50000)}
                                        </button>
                                    </div>
                                </div>

                                {/* Slider 2: Interest Rate */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold font-mono uppercase text-[#1A1A1A]/70">
                                            Annual Interest Rate (% p.a.)
                                        </span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-sm bg-[#F9F8F5] px-2.5 py-0.5 border border-[#1A1A1A]/15 rounded-sm">
                                            <input
                                                type="number"
                                                value={interestRate === 0 ? '' : interestRate}
                                                placeholder="0"
                                                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value) || 0))}
                                                className="w-14 bg-transparent outline-none text-right font-mono font-bold text-[#1A1A1A]"
                                                min="0"
                                                max="36"
                                                step="0.1"
                                            />
                                            <span>%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="24"
                                        step="0.25"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="w-full accent-[#088fff] cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-mono text-[#1A1A1A]/40 mt-0.5">
                                        <span>0%</span>
                                        <span>12.0%</span>
                                        <span>24.0%</span>
                                    </div>
                                    {/* Quick Rate Presets */}
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {[
                                            { rate: 0, label: '0% No-Cost' },
                                            { rate: 8.5, label: '8.5% Home' },
                                            { rate: 9.5, label: '9.5% Auto' },
                                            { rate: 12.0, label: '12% Personal' },
                                            { rate: 14.0, label: '14% NBFC' }
                                        ].map(p => (
                                            <button
                                                key={p.rate}
                                                type="button"
                                                onClick={() => setInterestRate(p.rate)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                                    interestRate === p.rate 
                                                        ? 'bg-[#088fff] text-white shadow-xs' 
                                                        : 'bg-[#F9F8F5] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/10'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Slider 3: Tenure (Months) */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-bold font-mono uppercase text-[#1A1A1A]/70">
                                            Tenure ({tenureMonths} Months / {(tenureMonths / 12).toFixed(1)} Years)
                                        </span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-sm bg-[#F9F8F5] px-2.5 py-0.5 border border-[#1A1A1A]/15 rounded-sm">
                                            <input
                                                type="number"
                                                value={tenureMonths === 0 ? '' : tenureMonths}
                                                placeholder="0"
                                                onChange={(e) => setTenureMonths(Math.max(0, Number(e.target.value) || 0))}
                                                className="w-12 bg-transparent outline-none text-right font-mono font-bold text-[#1A1A1A]"
                                                min="0"
                                                max="240"
                                            />
                                            <span className="text-xs">Mo</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="84"
                                        step="6"
                                        value={tenureMonths}
                                        onChange={(e) => setTenureMonths(Number(e.target.value))}
                                        className="w-full accent-[#088fff] cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-mono text-[#1A1A1A]/40 mt-0.5">
                                        <span>0 Mo</span>
                                        <span>36 Mo (3 Yrs)</span>
                                        <span>84 Mo (7 Yrs)</span>
                                    </div>
                                    {/* Quick Tenure Presets */}
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {[
                                            { months: 6, label: '6 Mo' },
                                            { months: 12, label: '1 Yr' },
                                            { months: 24, label: '2 Yrs' },
                                            { months: 36, label: '3 Yrs' },
                                            { months: 60, label: '5 Yrs' },
                                            { months: 84, label: '7 Yrs' }
                                        ].map(t => (
                                            <button
                                                key={t.months}
                                                type="button"
                                                onClick={() => setTenureMonths(t.months)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                                    tenureMonths === t.months 
                                                        ? 'bg-[#088fff] text-white shadow-xs' 
                                                        : 'bg-[#F9F8F5] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/10'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Amortization Result Box */}
                        <div className="mt-5 pt-4 border-t border-[#1A1A1A]/10 bg-[#F9F8F5] p-4 rounded-sm border">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <div>
                                    <span className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/50 block">
                                        MONTHLY EMI PAYABLE
                                    </span>
                                    <div className="text-xl sm:text-2xl font-editorial font-bold text-[#088fff] mt-0.5">
                                        {formatCurrency(emiCalculation.monthlyEmi)}
                                    </div>
                                    <span className="text-[10px] font-mono text-[#1A1A1A]/50">Per month</span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/50 block">
                                        TOTAL INTEREST
                                    </span>
                                    <div className="text-xl sm:text-2xl font-editorial font-bold text-amber-600 mt-0.5">
                                        {formatCurrency(emiCalculation.totalInterest)}
                                    </div>
                                    <span className="text-[10px] font-mono text-[#1A1A1A]/50">{emiCalculation.interestShare}% of repayment</span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/50 block">
                                        TOTAL REPAYMENT
                                    </span>
                                    <div className="text-xl sm:text-2xl font-editorial font-bold text-[#1A1A1A] mt-0.5">
                                        {formatCurrency(emiCalculation.totalPayment)}
                                    </div>
                                    <span className="text-[10px] font-mono text-[#1A1A1A]/50">Principal + Interest</span>
                                </div>
                            </div>

                            {/* Breakup Visualizer Bar */}
                            <div className="mb-3.5">
                                <div className="flex justify-between items-center text-[10px] font-mono uppercase font-bold mb-1">
                                    <span>Principal ({emiCalculation.principalShare}%)</span>
                                    <span className="text-amber-600">Interest ({emiCalculation.interestShare}%)</span>
                                </div>
                                <div className={`h-2 w-full rounded-full overflow-hidden flex ${emiCalculation.monthlyEmi > 0 ? 'bg-amber-500' : 'bg-[#1A1A1A]/10'}`}>
                                    <div 
                                        style={{ width: `${emiCalculation.principalShare}%` }} 
                                        className="bg-[#088fff] h-full transition-all duration-300" 
                                        title={`Principal: ${formatCurrency(Number(loanAmount))}`}
                                    />
                                </div>
                            </div>

                            {/* Sleek Inline Due Date Selection */}
                            <div className="flex items-center justify-between text-xs font-mono mb-3.5 px-3 py-2 bg-white rounded border border-[#1A1A1A]/10 text-[#1A1A1A]">
                                <span className="flex items-center gap-1.5 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-[#088fff]" />
                                    <span>Monthly Auto-Debit Day:</span>
                                </span>
                                <select
                                    value={loanDueDay}
                                    onChange={(e) => setLoanDueDay(Number(e.target.value))}
                                    className="bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded px-2.5 py-1 text-xs font-mono font-bold text-[#1A1A1A] outline-none cursor-pointer"
                                >
                                    {[1, 5, 10, 15, 20, 25, 28, 30].map(d => (
                                        <option key={d} value={d}>Day {d} of month</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleSaveCalculatedLoan}
                                className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-widest font-bold py-3 px-4 rounded-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Save & Register to Active EMI Ledger</span>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INTERACTIVE AMORTIZATION & REPAYMENT INTELLIGENCE (OPTION 1) */}
                    <div className="lg:col-span-5 flex flex-col h-full">
                        <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-6 shadow-md flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center justify-between pb-3.5 border-b border-[#1A1A1A]/10 mb-3.5">
                                    <div className="flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-[#088fff]" />
                                        <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">
                                            AMORTIZATION & REPAYMENT INTELLIGENCE
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {userCards.length > 1 && (
                                            <div className="flex items-center gap-1 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded px-1.5 py-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBreakdownSource('ledger');
                                                        setActiveCardIndex(prev => (prev - 1 + userCards.length) % userCards.length);
                                                    }}
                                                    className="p-0.5 hover:bg-white rounded text-[#1A1A1A]/70 hover:text-[#088fff] cursor-pointer transition-colors"
                                                    title="Previous Loan"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-[10px] font-mono font-bold text-[#1A1A1A]">
                                                    {activeCardIndex + 1}/{userCards.length}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBreakdownSource('ledger');
                                                        setActiveCardIndex(prev => (prev + 1) % userCards.length);
                                                    }}
                                                    className="p-0.5 hover:bg-white rounded text-[#1A1A1A]/70 hover:text-[#088fff] cursor-pointer transition-colors"
                                                    title="Next Loan"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                            activeLoanAnalysis.isSimulated 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                : (activeLoanAnalysis.hasCard ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200')
                                        }`}>
                                            {activeLoanAnalysis.isSimulated ? 'Live Model' : (activeLoanAnalysis.hasCard ? 'Active Ledger Card' : 'Zero State')}
                                        </span>
                                    </div>
                                </div>

                                {/* Multi-Loan Scrolling Tabs */}
                                {userCards.length > 1 && (
                                    <div className="mb-4 bg-[#F9F8F5] p-2 rounded-sm border border-[#1A1A1A]/10">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/50 font-bold">
                                                Switch Loan ({userCards.length} Registered):
                                            </span>
                                            {loanAmount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setBreakdownSource(prev => prev === 'calculator' ? 'ledger' : 'calculator')}
                                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                                        breakdownSource === 'calculator'
                                                            ? 'bg-[#088fff] text-white border-[#088fff]'
                                                            : 'bg-white text-[#088fff] border-blue-200 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    {breakdownSource === 'calculator' ? '● Live Calculator' : 'View Calculator'}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                            {userCards.map((card, idx) => {
                                                const isSelected = breakdownSource !== 'calculator' && activeCardIndex === idx;
                                                const cat = getLoanCategoryIcon(card.title, card.cardType);
                                                return (
                                                    <button
                                                        key={card.id || idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveCardIndex(idx);
                                                            setBreakdownSource('ledger');
                                                        }}
                                                        className={`shrink-0 px-2.5 py-1.5 rounded-sm text-xs font-mono text-left transition-all duration-200 border cursor-pointer flex items-center gap-2 ${
                                                            isSelected
                                                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm'
                                                                : 'bg-white text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                                                        }`}
                                                    >
                                                        <span className="text-xs">{cat.icon}</span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold truncate max-w-[120px]">{card.title}</span>
                                                                {isSelected && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#088fff] shrink-0 animate-pulse" />
                                                                )}
                                                            </div>
                                                            <div className={`text-[10px] ${isSelected ? 'text-emerald-300 font-semibold' : 'text-[#1A1A1A]/60'}`}>
                                                                {formatCurrency(card.numericAmount || 0)}/mo
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {activeLoanAnalysis.isActive ? (
                                    <div className="space-y-4">
                                        {/* Target Loan Header Banner */}
                                        <div className="flex items-center justify-between p-3 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/50 block">Target Commitment</span>
                                                    {activeLoanAnalysis.hasCard && (
                                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#088fff] border border-blue-200">
                                                            {getLoanCategoryIcon(activeLoanAnalysis.title, activeLoanAnalysis.targetCard?.cardType).label}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-editorial font-bold text-[#1A1A1A] block mt-0.5">{activeLoanAnalysis.title}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/50 block">Maturity Horizon</span>
                                                <span className="text-xs font-mono font-bold text-[#088fff] flex items-center gap-1 justify-end">
                                                    <Clock className="w-3 h-3" />
                                                    {activeLoanAnalysis.maturityDate}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Visual SVG Donut + Split Summary */}
                                        <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-sm bg-gradient-to-br from-[#F9F8F5] to-white border border-[#1A1A1A]/10">
                                            {/* SVG Donut */}
                                            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                    <circle
                                                        cx="18"
                                                        cy="18"
                                                        r="15.9155"
                                                        fill="none"
                                                        stroke="#f59e0b"
                                                        strokeWidth="4"
                                                    />
                                                    <circle
                                                        cx="18"
                                                        cy="18"
                                                        r="15.9155"
                                                        fill="none"
                                                        stroke="#088fff"
                                                        strokeWidth="4"
                                                        strokeDasharray={`${activeLoanAnalysis.principalShare} ${100 - activeLoanAnalysis.principalShare}`}
                                                        strokeDashoffset="0"
                                                        strokeLinecap="round"
                                                        className="transition-all duration-500"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-sm font-editorial font-bold text-[#1A1A1A]">
                                                        {activeLoanAnalysis.principalShare}%
                                                    </span>
                                                    <span className="text-[8px] font-mono uppercase tracking-tight text-[#1A1A1A]/50 font-bold">
                                                        Principal
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Capital Legend Breakdown */}
                                            <div className="flex-1 w-full space-y-1.5 text-xs font-mono">
                                                <div className="flex items-center justify-between pb-1 border-b border-[#1A1A1A]/10">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[#088fff] shrink-0" />
                                                        <span className="text-[#1A1A1A]/70 font-medium">Principal Capital</span>
                                                    </div>
                                                    <span className="font-bold text-[#1A1A1A]">{formatCurrency(activeLoanAnalysis.principal)}</span>
                                                </div>

                                                <div className="flex items-center justify-between pb-1 border-b border-[#1A1A1A]/10">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                                        <span className="text-[#1A1A1A]/70 font-medium">Interest Burden</span>
                                                    </div>
                                                    <span className="font-bold text-amber-600">{formatCurrency(activeLoanAnalysis.totalInterest)}</span>
                                                </div>

                                                <div className="flex items-center justify-between pt-0.5">
                                                    <span className="text-[#1A1A1A]/50 text-[10px]">Interest Ratio</span>
                                                    <span className="font-bold text-[#1A1A1A] text-[10px]">{activeLoanAnalysis.interestRatio}% of principal</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lifetime Cost Summary Grid */}
                                        <div className="grid grid-cols-2 gap-2.5 p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                            <div>
                                                <span className="text-[9px] font-mono uppercase text-[#1A1A1A]/50 block">Monthly Outflow</span>
                                                <span className="text-base font-editorial font-bold text-[#088fff]">
                                                    {formatCurrency(activeLoanAnalysis.monthlyEmi)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-mono uppercase text-[#1A1A1A]/50 block">Total Lifetime Cost</span>
                                                <span className="text-base font-editorial font-bold text-[#1A1A1A]">
                                                    {formatCurrency(activeLoanAnalysis.totalLifetimeCost || (activeLoanAnalysis.principal + activeLoanAnalysis.totalInterest))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Interactive Smart Prepayment Simulator */}
                                        <div className="p-3.5 rounded-sm bg-blue-50/70 border border-blue-200/80 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className="w-3.5 h-3.5 text-[#088fff]" />
                                                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-blue-950">
                                                        Smart Prepayment Simulator
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-mono text-blue-700 font-bold">Accelerate Payoff</span>
                                            </div>

                                            <p className="text-[11px] text-blue-900 leading-relaxed font-sans-clean">
                                                {activeLoanAnalysis.prepaymentTip}
                                            </p>

                                            {/* Quick Prepayment Buttons */}
                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                <span className="text-[10px] font-mono text-blue-800 font-bold shrink-0">Test Extra/Mo:</span>
                                                {[500, 1000, 2000, 5000].map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setExtraSimPayment(amt)}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                                            extraSimPayment === amt
                                                                ? 'bg-[#088fff] text-white shadow-xs'
                                                                : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-100'
                                                        }`}
                                                    >
                                                        +{formatCompact(amt)}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-1.5 border-t border-blue-200/60 text-[10px] font-mono">
                                                <span className="text-blue-800">Monthly Extra Prepayment:</span>
                                                <strong className="text-blue-950 font-bold">+{formatCurrency(extraSimPayment || 500)}/mo extra</strong>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm text-center">
                                            <PieChart className="w-7 h-7 text-[#088fff] mx-auto mb-2" />
                                            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A] mb-1">
                                                Amortization Intelligence Engine
                                            </h4>
                                            <p className="text-xs text-[#1A1A1A]/60 max-w-xs mx-auto leading-relaxed">
                                                Enter loan parameters on the left or click a preset below to simulate live interest schedules and prepayment savings.
                                            </p>
                                        </div>

                                        <div>
                                            <span className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/60 block mb-2">
                                                Quick Test Models:
                                            </span>
                                            <div className="space-y-2">
                                                {[
                                                    { title: 'Vehicle Loan', amt: 600000, rate: 9.5, tenure: 36, tag: 'Car / Bike' },
                                                    { title: 'Consumer Gadget', amt: 75000, rate: 12.0, tenure: 12, tag: 'Electronics' },
                                                    { title: 'Home Renovation', amt: 1200000, rate: 8.75, tenure: 60, tag: 'Renovation' }
                                                ].map(m => (
                                                    <button
                                                        key={m.title}
                                                        type="button"
                                                        onClick={() => {
                                                            setLoanTitle(m.title);
                                                            setLoanAmount(m.amt);
                                                            setInterestRate(m.rate);
                                                            setTenureMonths(m.tenure);
                                                        }}
                                                        className="w-full p-2.5 bg-white hover:bg-blue-50/50 border border-[#1A1A1A]/10 hover:border-[#088fff]/50 rounded-sm flex items-center justify-between text-left transition-all cursor-pointer group"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-xs text-[#1A1A1A] group-hover:text-[#088fff] transition-colors">
                                                                {m.title}
                                                            </div>
                                                            <div className="text-[10px] font-mono text-[#1A1A1A]/50">
                                                                {formatCurrency(m.amt)} • {m.rate}% • {m.tenure} Mo
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#F9F8F5] group-hover:bg-blue-100 text-[#1A1A1A]/70 group-hover:text-blue-900 border border-[#1A1A1A]/10">
                                                            Load Model →
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Tile: DTI Budget Impact Meter */}
                            <div className="mt-4 pt-3.5 border-t border-[#1A1A1A]/10">
                                <div className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-[#088fff] shrink-0" />
                                        <div>
                                            <span className="text-[9px] font-mono uppercase font-bold text-[#1A1A1A]/50 block">
                                                CIBIL Debt-to-Income Impact
                                            </span>
                                            <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                                                {dtiMetrics.status} ({dtiMetrics.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDtiModal(true)}
                                        className="text-[10px] font-mono font-bold text-[#088fff] hover:underline cursor-pointer"
                                    >
                                        How it works →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTIVE RECURRING EMI OBLIGATION LEDGER */}
                <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-6 sm:p-8 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1A1A1A]/10 mb-6 gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#088fff] block mb-1">
                                MONTHLY DEBT TRACKER
                            </span>
                            <h2 className="text-2xl font-editorial font-bold text-[#1A1A1A]">
                                Active Recurring EMI Obligations
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-[#1A1A1A]/60">
                                Total: <strong className="text-[#1A1A1A]">{formatCurrency(totalMonthlyEmiCommitment)}/mo</strong>
                            </span>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs uppercase tracking-wider font-bold py-2 px-3.5 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Obligation</span>
                            </button>
                        </div>
                    </div>

                    {userCards.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[#1A1A1A]/20 rounded-sm">
                            <CreditCard className="w-10 h-10 text-[#1A1A1A]/30 mx-auto mb-3" />
                            <h3 className="text-base font-editorial font-bold text-[#1A1A1A]">No Active EMI Commitments</h3>
                            <p className="text-xs text-[#1A1A1A]/60 max-w-sm mx-auto mt-1 mb-4">
                                You currently have no recurring loan EMIs registered in your ledger. Use the loan calculator above or click below to register one.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase rounded-sm hover:bg-[#088fff]"
                            >
                                Add Your First EMI
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#1A1A1A]/10 text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A]/60">
                                        <th className="py-3.5 px-4 font-bold">Loan Specimen / Category</th>
                                        <th className="py-3.5 px-4 font-bold">Monthly EMI</th>
                                        <th className="py-3.5 px-4 font-bold">Installment Progress</th>
                                        <th className="py-3.5 px-4 font-bold">Due Cycle & Status</th>
                                        <th className="py-3.5 px-4 font-bold">Linked Account</th>
                                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1A1A1A]/5 text-xs font-sans-clean">
                                    {userCards.map((card, idx) => {
                                        const status = getCardNextDueDate(card);
                                        const cat = getLoanCategoryIcon(card.title, card.cardType);
                                        const totalTenure = Number(card.tenureMonths) || 12;
                                        const paidCount = Number(card.paidInstallments) || 0;
                                        const progressPct = Math.min(100, Math.round((paidCount / totalTenure) * 100));
                                        
                                        const today = new Date();
                                        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                                        const isPaidThisMonth = card.lastPaidDate === currentMonthKey;
                                        const isSelectedForAnalysis = breakdownSource !== 'calculator' && activeCardIndex === idx;

                                        return (
                                            <tr 
                                                key={card.id || idx} 
                                                onClick={() => {
                                                    setActiveCardIndex(idx);
                                                    setBreakdownSource('ledger');
                                                }}
                                                className={`transition-all duration-200 group cursor-pointer ${
                                                    isSelectedForAnalysis 
                                                        ? 'bg-blue-50/70 border-l-4 border-l-[#088fff] shadow-xs' 
                                                        : 'hover:bg-[#F9F8F5]/80'
                                                }`}
                                            >
                                                {/* Specimen / Obligation */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-8 h-8 rounded-sm flex items-center justify-center text-sm shadow-xs border border-black/10 shrink-0" 
                                                            style={{ background: card.themeGradient || THEME_MAP.black.gradient }}
                                                            title={card.cardType}
                                                        >
                                                            <span>{cat.icon}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-[#1A1A1A]">{card.title}</span>
                                                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${cat.badgeClass}`}>
                                                                    {cat.label}
                                                                </span>
                                                                {isSelectedForAnalysis && (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-[#088fff] border border-blue-200">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#088fff] animate-pulse" />
                                                                        Inspecting
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-mono text-[#1A1A1A]/50 block mt-0.5">{card.cardType}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Monthly EMI */}
                                                <td className="py-4 px-4">
                                                    <div className="font-mono font-bold text-sm text-[#1A1A1A]">
                                                        {card.amount}
                                                    </div>
                                                    <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                                                        Annual: {formatCurrency((card.numericAmount || 0) * 12)}
                                                    </span>
                                                </td>

                                                {/* Installment Progress */}
                                                <td className="py-4 px-4 min-w-[150px]">
                                                    <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                                                        <span className="font-bold text-[#1A1A1A]">
                                                            {paidCount} of {totalTenure} Mos
                                                        </span>
                                                        <span className="text-[#088fff] font-bold">
                                                            {progressPct}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-[#1A1A1A]/10 h-1.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className="bg-[#088fff] h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${progressPct}%` }}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Due Cycle & Status */}
                                                <td className="py-4 px-4">
                                                    {status.isMatured ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                Fully Settled (Matured)
                                                            </span>
                                                            <span className="text-[10px] font-mono text-[#1A1A1A]/50 block">
                                                                All {totalTenure} EMIs Complete
                                                            </span>
                                                        </div>
                                                    ) : isPaidThisMonth ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                Paid for {today.toLocaleDateString('en-IN', { month: 'short' })}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-[#088fff] font-bold block">
                                                                Next debit: {status.formattedDate}
                                                            </span>
                                                            <span className="text-[9px] font-mono text-[#1A1A1A]/50 block">
                                                                {status.badge}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-0.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${status.badgeClass}`}>
                                                                {status.badge}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-[#1A1A1A]/70 font-semibold block">
                                                                Due on {status.formattedDate}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Linked Account */}
                                                <td className="py-4 px-4 font-mono text-xs text-[#1A1A1A]/70">
                                                    {card.cardNumber}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Inspect / Select button */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveCardIndex(idx);
                                                                setBreakdownSource('ledger');
                                                                window.scrollTo({ top: 380, behavior: 'smooth' });
                                                            }}
                                                            className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                                                                isSelectedForAnalysis
                                                                    ? 'bg-[#088fff] text-white shadow-xs'
                                                                    : 'text-[#1A1A1A]/50 hover:text-[#088fff] hover:bg-blue-50'
                                                            }`}
                                                            title="Inspect Amortization Breakdown for this loan"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>

                                                        {status.isMatured ? (
                                                            <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded-sm border border-emerald-200 inline-flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                <span>Completed</span>
                                                            </span>
                                                        ) : isPaidThisMonth ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkInstallmentUnpaid(card);
                                                                }}
                                                                className="w-[96px] py-1.5 bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border border-emerald-200 hover:border-rose-200 text-[10px] font-mono font-bold rounded-sm transition-colors duration-150 flex items-center justify-center gap-1 group/btn cursor-pointer shadow-xs select-none shrink-0"
                                                                title="Marked Paid for this cycle. Click to Undo and mark Unpaid."
                                                            >
                                                                <span className="pointer-events-none flex items-center gap-1 group-hover/btn:hidden">
                                                                    <Check className="w-3 h-3 text-emerald-600" />
                                                                    <span>Settled ✓</span>
                                                                </span>
                                                                <span className="pointer-events-none hidden group-hover/btn:flex items-center gap-1 text-rose-700">
                                                                    <RotateCcw className="w-3 h-3 text-rose-600" />
                                                                    <span>Mark Unpaid</span>
                                                                </span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPayingEmiCard(card);
                                                                    setLogToCashflow(false);
                                                                }}
                                                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold rounded-sm transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                                title="Mark this month's installment paid"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                <span>Mark Paid</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditModal(card);
                                                            }}
                                                            className="text-[#1A1A1A]/50 hover:text-[#088fff] p-1.5 hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                                                            title="Edit EMI Obligation"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPendingDeleteLoan(card);
                                                            }}
                                                            className="text-[#1A1A1A]/40 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                                                            title="Remove Obligation"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                    </>
                ) : (
                    /* DEDICATED CREDIT CARDS CENTER */
                    <div className="space-y-8 mb-8">
                        {/* Benchmarking & Strategy Banner */}
                        <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0 text-[#088fff]">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                                            Revolving Credit & CIBIL Health Benchmark
                                        </h3>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${ccMetrics.badgeClass}`}>
                                            {ccMetrics.status} ({ccMetrics.utilization}%)
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#1A1A1A]/70 font-sans-clean mt-1">
                                        {ccMetrics.tip} Keeping total revolving credit utilization strictly under 30% signals prime creditworthiness to Indian banks.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setNewCcForm(DEFAULT_CC_FORM);
                                    setShowAddCcModal(true);
                                }}
                                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#088fff] text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Credit Card</span>
                            </button>
                        </div>

                        {/* If NO Credit Cards exist: Clean Zero State */}
                        {creditCards.length === 0 ? (
                            <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-12 text-center shadow-md">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F9F8F5] border border-[#1A1A1A]/10 flex items-center justify-center text-[#088fff]">
                                    <CreditCard className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-editorial font-bold text-[#1A1A1A] mb-2">
                                    No Credit Cards Linked Yet
                                </h3>
                                <p className="text-sm text-[#1A1A1A]/60 max-w-lg mx-auto mb-6 font-sans-clean">
                                    Add your credit cards to track individual credit lines, safeguard your CIBIL score with 30% utilization alerts, monitor statement due cycles, and manage bill settlements as independent liabilities.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewCcForm(DEFAULT_CC_FORM);
                                        setShowAddCcModal(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition-all shadow-md cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Your First Credit Card</span>
                                </button>

                                {/* Value Props */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-10 text-left">
                                    <div className="p-4 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                        <div className="font-mono text-xs font-bold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                                            <Percent className="w-3.5 h-3.5 text-[#088fff]" />
                                            <span>30% Utilization Guard</span>
                                        </div>
                                        <p className="text-[11px] text-[#1A1A1A]/60 font-sans-clean">
                                            Live alerts when your outstanding balance approaches high-risk CIBIL rating degradation limits.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                        <div className="font-mono text-xs font-bold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-[#088fff]" />
                                            <span>Cycle & Due Countdown</span>
                                        </div>
                                        <p className="text-[11px] text-[#1A1A1A]/60 font-sans-clean">
                                            Automatic statement billing day tracking and color-coded countdowns to prevent late finance charges.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                        <div className="font-mono text-xs font-bold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-[#088fff]" />
                                            <span>Protected Cash Flow</span>
                                        </div>
                                        <p className="text-[11px] text-[#1A1A1A]/60 font-sans-clean">
                                            One-click bill settlement zeroes monthly statement dues without double-counting your liquid cash.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* SHOWCASE RACK: REAL METALLIC CREDIT CARDS */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-[#088fff]" />
                                            <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">
                                                METALLIC CARD PORTFOLIO ({creditCards.length})
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                                            Live Credit Limits & Real-Time Balance Burn
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {creditCards.map((card) => {
                                            const limit = Number(card.creditLimit) || 0;
                                            const balance = Number(card.currentBalance) || 0;
                                            const ratio = limit > 0 ? (balance / limit) * 100 : 0;
                                            const dueStatus = getCreditCardDueStatus(card);
                                            const theme = THEME_MAP[card.themeKey] || THEME_MAP.black;

                                            return (
                                                <div
                                                    key={card.id}
                                                    className="relative aspect-[1.586/1] rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between overflow-hidden border border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl select-none"
                                                    style={{ background: theme.gradient }}
                                                >
                                                    {/* Metallic Sheen Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none" />
                                                    <div className="absolute -right-16 -top-16 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                                                    {/* Top Row: Bank Name, Card Name, Network */}
                                                    <div className="relative z-10 flex items-start justify-between">
                                                        <div>
                                                            <div className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-white/70">
                                                                {card.bankName || 'BANK'}
                                                            </div>
                                                            <div className="text-sm font-editorial font-bold tracking-wide text-white drop-shadow-sm truncate max-w-[170px]">
                                                                {card.cardName || 'Credit Card'}
                                                            </div>
                                                        </div>

                                                        <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white border border-white/30 tracking-wider shadow-xs">
                                                            {card.network || 'VISA'}
                                                        </span>
                                                    </div>

                                                    {/* Middle Row: EMV Chip & Contactless Signal */}
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/80 shadow-xs flex flex-col justify-around p-1">
                                                            <div className="w-full h-px bg-amber-900/40" />
                                                            <div className="w-full h-px bg-amber-900/40" />
                                                        </div>

                                                        {/* Status pill inside card */}
                                                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border backdrop-blur-md ${dueStatus.badgeClass}`}>
                                                            {dueStatus.badge}
                                                        </span>
                                                    </div>

                                                    {/* Bottom Row: Number, Holder, Limit Progress Bar */}
                                                    <div className="relative z-10 space-y-2">
                                                        <div className="font-mono text-base tracking-[0.25em] text-white/95 drop-shadow-sm flex items-center justify-between">
                                                            <span>•••• •••• •••• <strong className="text-white font-bold">{card.last4 || '4821'}</strong></span>
                                                        </div>

                                                        <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                                                            <span className="uppercase tracking-wider truncate max-w-[150px]">
                                                                {card.holderName || 'CARDHOLDER'}
                                                            </span>
                                                            <span className="text-[9px]">
                                                                Cycle: Day {card.statementDay || 15}
                                                            </span>
                                                        </div>

                                                        {/* Utilization Progress inside card */}
                                                        <div className="pt-1.5 border-t border-white/15">
                                                            <div className="flex justify-between items-center text-[9px] font-mono text-white/80 mb-1">
                                                                <span>Balance: {formatCurrency(balance)}</span>
                                                                <span>Limit: {formatCurrency(limit)}</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full transition-all duration-500 ${
                                                                        ratio > 50 ? 'bg-rose-400' : ratio > 30 ? 'bg-amber-400' : 'bg-emerald-400'
                                                                    }`}
                                                                    style={{ width: `${Math.min(100, Math.max(3, ratio))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CREDIT CARDS MANAGEMENT LEDGER TABLE */}
                                <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-8 shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6 gap-3">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-[#088fff]" />
                                            <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">
                                                REVOLVING CREDIT MANAGEMENT LEDGER
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-mono text-[#1A1A1A]/60">
                                                Total Active Cards: <strong className="text-[#1A1A1A]">{creditCards.length}</strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewCcForm(DEFAULT_CC_FORM);
                                                    setShowAddCcModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white rounded text-xs font-mono font-bold uppercase transition-colors shadow-xs cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span>Add Card</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#1A1A1A]/10 text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/60 bg-[#F9F8F5]/50">
                                                    <th className="py-3 px-4 font-bold">Card & Issuer</th>
                                                    <th className="py-3 px-4 font-bold">Approved Limit</th>
                                                    <th className="py-3 px-4 font-bold">Outstanding Due</th>
                                                    <th className="py-3 px-4 font-bold">Available Credit</th>
                                                    <th className="py-3 px-4 font-bold">Utilization %</th>
                                                    <th className="py-3 px-4 font-bold">Billing & Due Cycle</th>
                                                    <th className="py-3 px-4 font-bold">Settlement Status</th>
                                                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#1A1A1A]/5 text-xs">
                                                {creditCards.map((card) => {
                                                    const limit = Number(card.creditLimit) || 0;
                                                    const balance = Number(card.currentBalance) || 0;
                                                    const available = Math.max(0, limit - balance);
                                                    const ratio = limit > 0 ? (balance / limit) * 100 : 0;
                                                    const dueStatus = getCreditCardDueStatus(card);
                                                    const theme = THEME_MAP[card.themeKey] || THEME_MAP.black;

                                                    return (
                                                        <tr key={card.id} className="hover:bg-[#F9F8F5] transition-colors">
                                                            {/* Card & Issuer */}
                                                            <td className="py-4 px-4 font-mono">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-10 h-7 rounded-sm shadow-xs border border-[#1A1A1A]/20 flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0"
                                                                        style={{ background: theme.gradient }}
                                                                    >
                                                                        {card.network ? card.network.slice(0, 3) : 'CC'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-[#1A1A1A] font-sans-clean text-sm flex items-center gap-1.5">
                                                                            <span>{card.cardName || 'Credit Card'}</span>
                                                                        </div>
                                                                        <div className="text-[10px] text-[#1A1A1A]/50 flex items-center gap-1.5 font-mono">
                                                                            <span>{card.bankName}</span>
                                                                            <span>•</span>
                                                                            <span>•••• {card.last4 || '4821'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Approved Limit */}
                                                            <td className="py-4 px-4 font-mono font-bold text-[#1A1A1A]">
                                                                {formatCurrency(limit)}
                                                            </td>

                                                            {/* Outstanding Due */}
                                                            <td className="py-4 px-4 font-mono font-bold">
                                                                <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                                                    {formatCurrency(balance)}
                                                                </span>
                                                                {dueStatus.isPaidThisMonth && (
                                                                    <span className="block text-[9px] font-mono font-normal text-emerald-600">
                                                                        (Cycle Settled)
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Available Credit */}
                                                            <td className="py-4 px-4 font-mono font-bold text-emerald-700">
                                                                {formatCurrency(available)}
                                                            </td>

                                                            {/* Utilization % */}
                                                            <td className="py-4 px-4 font-mono">
                                                                <div className="space-y-1 min-w-[110px]">
                                                                    <div className="flex justify-between items-center text-[10px]">
                                                                        <span className={`font-bold ${
                                                                            ratio > 50 ? 'text-rose-600' : ratio > 30 ? 'text-amber-600' : 'text-emerald-700'
                                                                        }`}>
                                                                            {ratio.toFixed(1)}%
                                                                        </span>
                                                                        <span className="text-[9px] text-[#1A1A1A]/60 font-sans-clean font-semibold uppercase tracking-wider">
                                                                            {ratio <= 30 ? 'Optimal' : ratio <= 50 ? 'Moderate' : 'High'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full transition-all duration-300 ${
                                                                                ratio > 50 ? 'bg-rose-500' : ratio > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                            }`}
                                                                            style={{ width: `${Math.min(100, Math.max(3, ratio))}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Billing Cycle & Due */}
                                                            <td className="py-4 px-4 font-mono">
                                                                <div className="text-[11px] text-[#1A1A1A] font-bold">
                                                                    Bill: Day {card.statementDay || 15}
                                                                </div>
                                                                <div className="text-[10px] text-[#1A1A1A]/60 mt-0.5">
                                                                    Due: Day {card.dueDay || 5}
                                                                </div>
                                                                <div className="mt-1">
                                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${dueStatus.badgeClass}`}>
                                                                        {dueStatus.badge}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Settlement Status / Pay Bill */}
                                                            <td className="py-4 px-4 font-mono">
                                                                {dueStatus.isPaidThisMonth ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMarkCreditCardUnpaid(card)}
                                                                        className="w-[100px] py-1.5 bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border border-emerald-300 hover:border-rose-300 text-[10px] font-mono font-bold rounded-sm transition-colors duration-150 flex items-center justify-center gap-1.5 group/pay cursor-pointer shadow-xs select-none shrink-0"
                                                                        title="Marked Paid for this cycle. Click to Undo and mark Unpaid."
                                                                    >
                                                                        <span className="pointer-events-none flex items-center gap-1.5 group-hover/pay:hidden">
                                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                            <span>Settled ✓</span>
                                                                        </span>
                                                                        <span className="pointer-events-none hidden group-hover/pay:flex items-center gap-1.5 text-rose-700">
                                                                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                                                            <span>Mark Unpaid</span>
                                                                        </span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMarkCreditCardPaid(card)}
                                                                        className="px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-[10px] font-mono font-bold uppercase rounded-sm transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer"
                                                                        title="Settle statement balance for this billing cycle"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                        <span>Mark Paid {balance > 0 ? `(${formatCurrency(balance)})` : ''}</span>
                                                                    </button>
                                                                )}
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="py-4 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenEditCc(card)}
                                                                        className="text-[#1A1A1A]/50 hover:text-[#088fff] p-1.5 hover:bg-blue-50 rounded-sm transition-colors cursor-pointer"
                                                                        title="Edit Credit Card"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPendingDeleteCc(card)}
                                                                        className="text-[#1A1A1A]/40 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-sm transition-colors cursor-pointer"
                                                                        title="Remove Credit Card"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            <Footer onGetStarted={() => setIsGetStartedOpen(true)} />

            {/* Modal: Add Custom EMI Obligation / Loan */}
            {showAddModal && (() => {
                const previewPrincipal = parseFloat(newLoanForm.principal) || 0;
                const previewTenure = Math.max(1, parseInt(newLoanForm.tenureMonths) || 12);
                const previewPaid = Math.min(previewTenure, Math.max(0, parseInt(newLoanForm.paidInstallments) || 0));
                const previewRate = newLoanForm.isZeroInterest ? 0 : Math.max(0, Number(newLoanForm.annualRate) || 0);

                let previewEmi = parseFloat(newLoanForm.amount) || 0;
                if (previewEmi <= 0 && previewPrincipal > 0) {
                    previewEmi = computeStandardEmi(previewPrincipal, previewRate, previewTenure);
                }

                const previewTotal = previewEmi * previewTenure;
                const previewCalculatedPrincipal = previewRate === 0 
                    ? previewTotal 
                    : (previewPrincipal > 0 ? previewPrincipal : previewTotal);
                const previewInterest = Math.max(0, previewTotal - previewCalculatedPrincipal);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
                        <div className="bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 rounded-sm p-6 max-w-lg w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start pb-4 border-b border-[#1A1A1A]/10 mb-4 shrink-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-[#088fff]" />
                                        <h3 className="text-sm font-editorial font-bold text-[#1A1A1A] uppercase tracking-wider">
                                            Add New Loan / EMI Obligation
                                        </h3>
                                    </div>
                                    <p className="text-[11px] text-[#1A1A1A]/60 mt-1">
                                        Fill in the principal capital, tenure, and rate — your monthly EMI will be calculated automatically.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1.5 hover:bg-gray-100 rounded-sm cursor-pointer transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form Body (Scrollable) */}
                            <form onSubmit={handleAddModalCard} className="space-y-4 overflow-y-auto pr-1">
                                {/* 1. Category / Loan Type Selector */}
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1.5">
                                        Select Loan / Debt Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {LOAN_CATEGORIES.map(cat => {
                                            const isSelected = newLoanForm.category === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleCategorySelect(cat)}
                                                    className={`py-1.5 px-2 rounded-sm text-[11px] font-mono text-left flex items-center gap-1.5 border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-sm'
                                                            : 'bg-[#F9F8F5] text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                                                    }`}
                                                >
                                                    <span>{cat.icon}</span>
                                                    <span className="truncate">{cat.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Obligation Name */}
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Loan / Obligation Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={LOAN_CATEGORIES.find(c => c.id === newLoanForm.category)?.placeholder || 'e.g. HDFC Personal Loan'}
                                        value={newLoanForm.title}
                                        onChange={(e) => updateNewLoanField('title', e.target.value)}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff]"
                                    />
                                </div>

                                {/* 3. Loan Principal Capital (Primary Input) */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                            Loan Principal Capital ({symbol}) *
                                        </label>
                                        <span className="text-[9px] text-[#1A1A1A]/50 font-mono">
                                            Total sanctioned amount or purchase price
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#1A1A1A]/50 font-bold">{symbol}</span>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="e.g. 50000"
                                            value={newLoanForm.principal}
                                            onChange={(e) => updateNewLoanField('principal', e.target.value)}
                                            className="w-full pl-7 pr-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold text-[#1A1A1A]"
                                        />
                                    </div>
                                    {/* Quick Principal Presets */}
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {[10000, 25000, 50000, 100000, 250000, 500000].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => updateNewLoanField('principal', amt)}
                                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                                    Number(newLoanForm.principal) === amt
                                                        ? 'bg-[#1A1A1A] text-white font-bold'
                                                        : 'bg-gray-100 text-[#1A1A1A]/70 hover:bg-gray-200'
                                                }`}
                                            >
                                                {formatCompact(amt)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Tenure & Annual Interest Rate */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                                Tenure (Months) *
                                            </label>
                                            <div className="flex gap-1">
                                                {[3, 6, 12, 24, 36].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => updateNewLoanField('tenureMonths', m)}
                                                        className={`text-[9px] font-mono px-1 py-0.5 rounded cursor-pointer ${
                                                            parseInt(newLoanForm.tenureMonths) === m
                                                                ? 'bg-[#1A1A1A] text-white font-bold'
                                                                : 'bg-gray-100 text-[#1A1A1A]/60 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {m}m
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="360"
                                            value={newLoanForm.tenureMonths}
                                            onChange={(e) => updateNewLoanField('tenureMonths', e.target.value)}
                                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                                Interest Rate (% p.a.)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => updateNewLoanField('isZeroInterest', !newLoanForm.isZeroInterest)}
                                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                                    newLoanForm.isZeroInterest 
                                                        ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' 
                                                        : 'bg-gray-100 text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                                                }`}
                                            >
                                                ⚡ {newLoanForm.isZeroInterest ? '0% No-Cost' : 'Make 0% No-Cost'}
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            disabled={newLoanForm.isZeroInterest}
                                            placeholder="0 for No-Cost EMI"
                                            value={newLoanForm.isZeroInterest ? '0' : (newLoanForm.annualRate !== undefined ? newLoanForm.annualRate : '')}
                                            onChange={(e) => updateNewLoanField('annualRate', e.target.value)}
                                            className={`w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none font-mono ${
                                                newLoanForm.isZeroInterest ? 'bg-gray-100 text-emerald-700 cursor-not-allowed font-bold' : 'focus:border-[#088fff]'
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* 5. Monthly EMI (Auto-calculated with override support) */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                            Monthly EMI ({symbol}) *
                                        </label>
                                        {isEmiAutoCalculated ? (
                                            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                                ✓ Auto-Calculated
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => updateNewLoanField('principal', newLoanForm.principal)}
                                                className="text-[9px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 cursor-pointer"
                                                title="Reset to mathematically exact EMI"
                                            >
                                                ✎ Custom (Click to Recalculate)
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#1A1A1A]/50 font-bold">{symbol}</span>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="Calculates automatically as you type"
                                            value={newLoanForm.amount}
                                            onChange={(e) => updateNewLoanField('amount', e.target.value)}
                                            className="w-full pl-7 pr-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold text-[#1A1A1A]"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#1A1A1A]/50 mt-1 font-mono">
                                        Automatically synchronized. You may override if your bank has slight penny differences.
                                    </p>
                                </div>

                                {/* 6. Already Paid Installments & Auto-Debit Due Day */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                            Already Paid (Months)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={Math.max(0, (parseInt(newLoanForm.tenureMonths) || 12) - 1)}
                                            value={newLoanForm.paidInstallments}
                                            onChange={(e) => updateNewLoanField('paidInstallments', e.target.value)}
                                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                        />
                                        <span className="text-[9px] text-[#1A1A1A]/50 font-mono mt-0.5 block">0 for newly started loans</span>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                                Due Day (1–31) *
                                            </label>
                                            <div className="flex gap-1">
                                                {[1, 5, 10, 15, 20].map(d => (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => updateNewLoanField('dueDay', d)}
                                                        className={`text-[9px] font-mono px-1 py-0.5 rounded cursor-pointer ${
                                                            parseInt(newLoanForm.dueDay) === d
                                                                ? 'bg-[#1A1A1A] text-white font-bold'
                                                                : 'bg-gray-100 text-[#1A1A1A]/60 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max="31"
                                            value={newLoanForm.dueDay}
                                            onChange={(e) => updateNewLoanField('dueDay', e.target.value)}
                                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                        />
                                    </div>
                                </div>

                                {/* 7. Last 4 Digits & Presentation Theme */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                            Card / Loan Last 4 Digits
                                        </label>
                                        <input
                                            type="text"
                                            maxLength="4"
                                            placeholder="e.g. 9102"
                                            value={newLoanForm.last4}
                                            onChange={(e) => updateNewLoanField('last4', e.target.value.replace(/\D/g, ''))}
                                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                            Card Presentation Theme
                                        </label>
                                        <select
                                            value={newLoanForm.theme}
                                            onChange={(e) => updateNewLoanField('theme', e.target.value)}
                                            className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none bg-white font-mono"
                                        >
                                            {Object.entries(THEME_MAP).map(([key, item]) => (
                                                <option key={key} value={key}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Live Obligation Summary Preview Banner */}
                                {previewTotal > 0 && (
                                    <div className="bg-[#1A1A1A] text-white p-3.5 rounded-sm border border-white/10 space-y-2 mt-2">
                                        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                            <span>Ledger Preview</span>
                                            <span className="text-[#088fff] font-bold">{newLoanForm.category}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-editorial font-bold text-sm text-white truncate max-w-[200px]">
                                                {newLoanForm.title.trim() || 'Untitled Loan'}
                                            </span>
                                            <span className="font-mono font-bold text-emerald-400 text-sm">
                                                {formatCurrency(Math.round(previewEmi))}/mo
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] font-mono text-zinc-300">
                                            <div>
                                                <span className="text-zinc-500 block text-[9px] uppercase">Principal Capital</span>
                                                <span className="font-bold">{formatCurrency(Math.round(previewCalculatedPrincipal))}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500 block text-[9px] uppercase">Total Interest Drag</span>
                                                <span className={`font-bold ${previewRate === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {previewRate === 0 ? `${formatCurrency(0)} (0% No-Cost)` : formatCurrency(Math.round(previewInterest))}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500 block text-[9px] uppercase">Lifetime Total</span>
                                                <span className="font-bold">{formatCurrency(Math.round(previewTotal))}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="w-1/2 py-2.5 border border-[#1A1A1A]/20 text-xs font-mono uppercase font-bold rounded-sm hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-1/2 py-2.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono uppercase font-bold rounded-sm transition-colors shadow flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Add Loan to Ledger</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* Modal: Due Date Prompt upon Saving from Calculator */}
            {showSaveDueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 rounded-sm p-6 max-w-md w-full shadow-2xl relative">
                        <div className="flex justify-between items-center pb-4 border-b border-[#1A1A1A]/10 mb-5">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#088fff]" />
                                <h3 className="text-sm font-editorial font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    Set Monthly EMI Due Date
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowSaveDueModal(false)}
                                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                <div className="text-[10px] font-mono uppercase text-[#1A1A1A]/50 font-bold mb-1">
                                    Obligation Summary
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-[#1A1A1A]">{loanTitle.trim() || 'Amortized Loan'}</span>
                                    <span className="font-mono font-bold text-sm text-[#088fff]">{formatCurrency(emiCalculation.monthlyEmi)}/mo</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-2">
                                    Select Monthly EMI Due Date (Auto-Debit Day: 1–31)
                                </label>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {[1, 5, 10, 15, 20, 25, 28, 30].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => setLoanDueDay(day)}
                                            className={`py-2 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                                                loanDueDay === day 
                                                    ? 'bg-[#088fff] text-white shadow-sm' 
                                                    : 'bg-[#F9F8F5] text-[#1A1A1A]/80 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/15'
                                            }`}
                                        >
                                            Day {day}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono">
                                    <span className="text-[#1A1A1A]/60">Or enter day directly (1-31):</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={loanDueDay}
                                        onChange={(e) => setLoanDueDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                                        className="w-16 px-2 py-1 bg-[#F9F8F5] border border-[#1A1A1A]/20 rounded text-center font-mono font-bold text-[#1A1A1A]"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-sm text-xs font-sans-clean text-blue-900">
                                📅 <strong>Billing Cycle:</strong> Due on the <strong>{loanDueDay}{loanDueDay === 1 ? 'st' : loanDueDay === 2 ? 'nd' : loanDueDay === 3 ? 'rd' : 'th'}</strong> of every month. Automatic countdown status will activate immediately.
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A1A1A]/10">
                                <button
                                    type="button"
                                    onClick={() => setShowSaveDueModal(false)}
                                    className="px-4 py-2 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-xs font-mono uppercase font-bold rounded-sm text-[#1A1A1A]/70 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleConfirmSaveCalculatedLoan(loanDueDay)}
                                    className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono uppercase tracking-wider font-bold rounded-sm shadow-md cursor-pointer transition-colors"
                                >
                                    Confirm & Save to Ledger
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Edit EMI Obligation */}
            {editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 rounded-sm p-6 max-w-lg w-full shadow-2xl relative my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-[#1A1A1A]/10 mb-5">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-[#088fff]" />
                                <h3 className="text-sm font-editorial font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    Edit EMI Obligation
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingCard(null)}
                                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditModal} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Obligation Name / Description
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Car Loan, iPhone 16 EMI"
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-medium"
                                />
                            </div>

                            {/* Loan Principal Capital */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Loan Principal Capital ({symbol}) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#1A1A1A]/50 font-bold">{symbol}</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="e.g. 50000"
                                        value={editForm.principal}
                                        onChange={(e) => updateEditFormField('principal', e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold text-[#1A1A1A]"
                                    />
                                </div>
                            </div>

                            {/* Tenure & Interest Rate */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                            Total Tenure (Months) *
                                        </label>
                                        <div className="flex gap-1">
                                            {[3, 6, 12, 24, 36].map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => updateEditFormField('tenureMonths', m)}
                                                    className={`text-[9px] font-mono px-1 py-0.5 rounded cursor-pointer ${
                                                        parseInt(editForm.tenureMonths) === m
                                                            ? 'bg-[#1A1A1A] text-white font-bold'
                                                            : 'bg-gray-100 text-[#1A1A1A]/60 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {m}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="360"
                                        value={editForm.tenureMonths}
                                        onChange={(e) => updateEditFormField('tenureMonths', Math.max(1, Number(e.target.value) || 12))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                            Interest Rate (% p.a.)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => updateEditFormField('isZeroInterest', !editForm.isZeroInterest)}
                                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                                editForm.isZeroInterest 
                                                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' 
                                                    : 'bg-gray-100 text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                                            }`}
                                        >
                                            ⚡ {editForm.isZeroInterest ? '0% No-Cost' : 'Make 0% No-Cost'}
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        disabled={editForm.isZeroInterest}
                                        placeholder="0 for No-Cost EMI"
                                        value={editForm.isZeroInterest ? '0' : (editForm.annualRate !== undefined ? editForm.annualRate : '')}
                                        onChange={(e) => updateEditFormField('annualRate', e.target.value)}
                                        className={`w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none font-mono ${
                                            editForm.isZeroInterest ? 'bg-gray-100 text-emerald-700 cursor-not-allowed font-bold' : 'focus:border-[#088fff]'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Monthly EMI */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                        Monthly EMI Amount ({symbol}) *
                                    </label>
                                    {isEditEmiAutoCalculated ? (
                                        <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                            ✓ Auto-Calculated
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => updateEditFormField('principal', editForm.principal)}
                                            className="text-[9px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 cursor-pointer"
                                            title="Recalculate exact EMI"
                                        >
                                            ✎ Custom (Click to Recalculate)
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#1A1A1A]/50 font-bold">{symbol}</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={editForm.amount}
                                        onChange={(e) => updateEditFormField('amount', e.target.value)}
                                        placeholder="e.g. 12500"
                                        className="w-full pl-7 pr-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold text-[#1A1A1A]"
                                    />
                                </div>
                            </div>

                            {/* Paid Count & Due Day */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Paid Installments Count
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max={editForm.tenureMonths}
                                        value={editForm.paidInstallments}
                                        onChange={(e) => updateEditFormField('paidInstallments', Math.max(0, Number(e.target.value) || 0))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70">
                                            Monthly Due Day (1-31) *
                                        </label>
                                        <div className="flex gap-1">
                                            {[1, 5, 10, 15, 20].map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => updateEditFormField('dueDay', d)}
                                                    className={`text-[9px] font-mono px-1 py-0.5 rounded cursor-pointer ${
                                                        Number(editForm.dueDay) === d 
                                                            ? 'bg-[#1A1A1A] text-white font-bold' 
                                                            : 'bg-gray-100 text-[#1A1A1A]/60 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={editForm.dueDay}
                                        onChange={(e) => updateEditFormField('dueDay', Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold"
                                    />
                                </div>
                            </div>

                            {/* Card Last 4 Digits */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Linked Card / Account Last 4
                                </label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    value={editForm.last4}
                                    onChange={(e) => updateEditFormField('last4', e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 7721"
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                />
                                <span className="text-[9px] font-mono text-[#1A1A1A]/50 mt-0.5 block">For statement tracking</span>
                            </div>

                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Metallic Card Theme Finish
                                </label>
                                <div className="grid grid-cols-7 gap-2 p-2 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                    {Object.entries(THEME_MAP).map(([key, item]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEditForm(prev => ({ ...prev, theme: key }))}
                                            title={item.name}
                                            className={`h-7 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                                                editForm.theme === key
                                                    ? 'ring-2 ring-[#088fff] ring-offset-2 scale-105 shadow-sm'
                                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                            }`}
                                            style={{ background: item.gradient }}
                                        >
                                            {editForm.theme === key && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 flex gap-3 border-t border-[#1A1A1A]/10">
                                <button
                                    type="button"
                                    onClick={() => setEditingCard(null)}
                                    className="w-1/2 py-2.5 border border-[#1A1A1A]/20 text-xs font-mono uppercase font-bold rounded-sm hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 py-2.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono uppercase font-bold rounded-sm transition-colors shadow cursor-pointer"
                                >
                                    Save & Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DTI Explainer & Score Impact Modal */}
            {showDtiModal && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
                    onClick={() => setShowDtiModal(false)}
                >
                    <div 
                        className="bg-white text-[#1A1A1A] w-full max-w-2xl rounded-sm shadow-2xl border border-[#1A1A1A]/20 relative my-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/10 bg-[#F9F8F5]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#088fff]/10 flex items-center justify-center text-[#088fff] border border-[#088fff]/20">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-editorial font-bold text-[#1A1A1A] tracking-tight">
                                        Debt-to-Income (DTI) Telemetry
                                    </h3>
                                    <span className="text-[10px] text-[#1A1A1A]/60 font-mono uppercase tracking-wider block">
                                        Fintech Formula, Live Breakdown & Health Score Impact
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDtiModal(false)}
                                className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] p-1.5 rounded-sm hover:bg-[#1A1A1A]/5 transition-colors cursor-pointer"
                                aria-label="Close dialog"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Current Metric Spotlight */}
                            <div className="p-5 bg-[#1A1A1A] text-white rounded-sm border border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                <div>
                                    <span className="text-[10px] font-mono uppercase text-white/50 tracking-wider block mb-1">
                                        Your Active DTI Burden
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl sm:text-4xl font-editorial font-bold text-white">
                                            {dtiMetrics.percentage}%
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${dtiMetrics.badgeClass}`}>
                                            {dtiMetrics.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/80 font-sans-clean mt-2">
                                        {dtiMetrics.label}
                                    </p>
                                </div>

                                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-5">
                                    <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                                        Health Score (Pillar 4)
                                    </span>
                                    <span className="text-2xl font-editorial font-bold text-[#088fff]">
                                        {dtiScorePoints} <span className="text-xs font-mono text-white/60">/ 20 pts</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-white/50 block mt-1">
                                        Max 20% weight factor
                                    </span>
                                </div>
                            </div>

                            {/* Mathematical Calculation Box */}
                            <div className="p-4 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#1A1A1A]/60 flex items-center gap-1.5">
                                        <Calculator className="w-3.5 h-3.5 text-[#088fff]" />
                                        <span>How It Is Calculated</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-[#088fff] font-bold">Standard RBI & Banking Formula</span>
                                </div>

                                <div className="bg-white p-3 rounded-sm border border-[#1A1A1A]/10 font-mono text-xs text-[#1A1A1A] space-y-2">
                                    <div className="text-center font-bold text-sm text-[#1A1A1A] py-1 border-b border-[#1A1A1A]/10">
                                        DTI Ratio = ( Total Monthly EMI Commitments ÷ Monthly Net Income ) × 100
                                    </div>

                                    <div className="pt-2 text-[11px] text-[#1A1A1A]/80 space-y-1">
                                        <div className="flex justify-between">
                                            <span>• Total Monthly EMI Commitments:</span>
                                            <strong className="text-[#1A1A1A]">{formatCurrency(totalMonthlyEmiCommitment)}/mo</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>• Monthly Net Income (from Budget):</span>
                                            <strong className="text-[#1A1A1A]">{formatCurrency(Number(userBudget?.monthlyIncome || 0))}/mo</strong>
                                        </div>
                                        {Number(userBudget?.monthlyIncome || 0) > 0 ? (
                                            <div className="flex justify-between pt-2 border-t border-[#1A1A1A]/10 font-bold text-[#088fff]">
                                                <span>Live Math: ({formatCurrency(totalMonthlyEmiCommitment)} ÷ {formatCurrency(Number(userBudget?.monthlyIncome))}) × 100</span>
                                                <span>= {dtiMetrics.percentage}%</span>
                                            </div>
                                        ) : (
                                            <div className="pt-2 border-t border-[#1A1A1A]/10 text-amber-600 font-medium">
                                                * Monthly income is not yet configured. Update your income on Dashboard or Budget tab to get real-time DTI scoring.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Score Impact Table (Pillar 4: 20 Points Total) */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-[#088fff]" />
                                        <span>Health Score Tier Breakdown (Pillar 4)</span>
                                    </h4>
                                    <span className="text-[10px] font-mono text-[#1A1A1A]/50">
                                        Affects overall 100-pt Score
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div className="p-3 rounded-sm border border-emerald-200 bg-emerald-50/50">
                                        <div className="flex justify-between font-bold text-emerald-800 font-mono text-[11px]">
                                            <span>≤ 15% DTI Burden</span>
                                            <span>20 / 20 pts (Max)</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-700 font-sans-clean mt-1">
                                            Prime financial health. Negligible debt liability, highest borrowing bandwidth.
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-sm border border-blue-200 bg-blue-50/50">
                                        <div className="flex justify-between font-bold text-blue-800 font-mono text-[11px]">
                                            <span>15% - 30% DTI Burden</span>
                                            <span>15 - 19 pts</span>
                                        </div>
                                        <p className="text-[11px] text-blue-700 font-sans-clean mt-1">
                                            Healthy debt profile. Well within industry benchmarks for personal credit safety.
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-sm border border-amber-200 bg-amber-50/50">
                                        <div className="flex justify-between font-bold text-amber-800 font-mono text-[11px]">
                                            <span>30% - 45% DTI Burden</span>
                                            <span>8 - 14 pts</span>
                                        </div>
                                        <p className="text-[11px] text-amber-700 font-sans-clean mt-1">
                                            Elevated obligations. High recurring liabilities; avoid taking additional loans.
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-sm border border-rose-200 bg-rose-50/50">
                                        <div className="flex justify-between font-bold text-rose-800 font-mono text-[11px]">
                                            <span>&gt; 45% DTI Burden</span>
                                            <span>0 - 7 pts</span>
                                        </div>
                                        <p className="text-[11px] text-rose-700 font-sans-clean mt-1">
                                            Critical leverage. Majority of income pays debt; risk of emergency default.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payoff Tip */}
                            <div className="p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-sm flex items-start gap-2.5">
                                <Sparkles className="w-4 h-4 text-[#088fff] shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-900 leading-relaxed font-sans-clean">
                                    <strong className="font-bold">Fintech Tip:</strong> Each settled EMI card permanently lowers your total monthly commitment and directly boosts your Pillar 4 score back up to 20 points!
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-[#1A1A1A]/10 bg-[#F9F8F5] flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDtiModal(false);
                                    setShowFullHealthModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#088fff] hover:bg-[#088fff]/90 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                <Activity className="w-3.5 h-3.5" />
                                <span>View Full 4-Pillar Score Card →</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowDtiModal(false)}
                                className="px-4 py-2 border border-[#1A1A1A]/20 hover:bg-gray-100 text-[#1A1A1A] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Centrally Connected 4-Pillars Financial Health Index Modal */}
            <HealthScoreModal
                isOpen={showFullHealthModal}
                onClose={() => setShowFullHealthModal(false)}
                summary={{
                    totalIncome: Number(userBudget?.monthlyIncome || 0),
                    totalExpense: 0,
                    netSavings: Number(userBudget?.monthlyIncome || 0),
                    netWorth: Number(userBudget?.monthlyIncome || 0)
                }}
                vault={{}}
                runwayMonths={0}
                emiCards={userCards}
            />

            {/* Modal: Add Credit Card */}
            {showAddCcModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 rounded-sm p-6 max-w-lg w-full shadow-2xl relative my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-[#1A1A1A]/10 mb-5">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-[#088fff]" />
                                <h3 className="text-sm font-editorial font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    Add New Credit Card
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowAddCcModal(false)}
                                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCreditCard} className="space-y-4">
                            {/* Card Name / Nickname */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Card Product Name / Label
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Regalia Gold, Amazon Pay, Sapphiro"
                                    value={newCcForm.cardName}
                                    onChange={(e) => setNewCcForm(prev => ({ ...prev, cardName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-medium"
                                />
                            </div>

                            {/* Bank Selection */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Issuing Bank / Financial Institution
                                </label>
                                <select
                                    value={newCcForm.bankName}
                                    onChange={(e) => setNewCcForm(prev => ({ ...prev, bankName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none bg-white font-mono"
                                >
                                    {BANK_PRESETS.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>

                                {newCcForm.bankName === 'Other Bank' && (
                                    <div className="mt-2.5">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#088fff] block mb-1">
                                            Specify Your Bank Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Canara Bank, Union Bank, Bank of Baroda"
                                            value={newCcForm.customBankName || ''}
                                            onChange={(e) => setNewCcForm(prev => ({ ...prev, customBankName: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[#088fff] bg-blue-50/20 rounded-sm text-sm outline-none font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Network & Last 4 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Card Network
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {CC_NETWORKS.map(net => (
                                            <button
                                                key={net}
                                                type="button"
                                                onClick={() => setNewCcForm(prev => ({ ...prev, network: net }))}
                                                className={`py-1.5 text-xs font-mono font-bold rounded-sm border cursor-pointer transition-all ${
                                                    newCcForm.network === net
                                                        ? 'bg-[#088fff] text-white border-[#088fff]'
                                                        : 'bg-[#F9F8F5] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/10'
                                                }`}
                                            >
                                                {net}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Last 4 Digits
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="4"
                                        placeholder="e.g. 4821"
                                        value={newCcForm.last4}
                                        onChange={(e) => setNewCcForm(prev => ({ ...prev, last4: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>
                            </div>

                            {/* Approved Limit & Current Balance */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Total Sanctioned Limit ({symbol})
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1000"
                                        placeholder="e.g. 150000"
                                        value={newCcForm.creditLimit}
                                        onChange={(e) => setNewCcForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Current Statement Balance ({symbol})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 14200"
                                        value={newCcForm.currentBalance}
                                        onChange={(e) => setNewCcForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>
                            </div>

                            {/* Statement Day & Due Day */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Statement / Bill Day (1-31)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={newCcForm.statementDay}
                                        onChange={(e) => setNewCcForm(prev => ({ ...prev, statementDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Payment Due Day (1-31)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={newCcForm.dueDay}
                                        onChange={(e) => setNewCcForm(prev => ({ ...prev, dueDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>
                            </div>

                            {/* Cardholder Name */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Cardholder Name (Printed on Card)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. RAHUL SHARMA"
                                    value={newCcForm.holderName}
                                    onChange={(e) => setNewCcForm(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono uppercase"
                                />
                            </div>

                            {/* Theme Gradient Finish */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Metallic Card Sheen & Finish
                                </label>
                                <div className="grid grid-cols-7 gap-2 p-2 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                    {Object.entries(THEME_MAP).map(([key, item]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setNewCcForm(prev => ({ ...prev, themeKey: key }))}
                                            title={item.name}
                                            className={`h-7 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                                                newCcForm.themeKey === key
                                                    ? 'ring-2 ring-[#088fff] ring-offset-2 scale-105 shadow-sm'
                                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                            }`}
                                            style={{ background: item.gradient }}
                                        >
                                            {newCcForm.themeKey === key && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 flex gap-3 border-t border-[#1A1A1A]/10">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCcModal(false)}
                                    className="w-1/2 py-2.5 border border-[#1A1A1A]/20 text-xs font-mono uppercase font-bold rounded-sm hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 py-2.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono uppercase font-bold rounded-sm transition-colors shadow cursor-pointer"
                                >
                                    Save Credit Card
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Credit Card */}
            {editingCc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white text-[#1A1A1A] border border-[#1A1A1A]/20 rounded-sm p-6 max-w-lg w-full shadow-2xl relative my-8">
                        <div className="flex justify-between items-center pb-4 border-b border-[#1A1A1A]/10 mb-5">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-[#088fff]" />
                                <h3 className="text-sm font-editorial font-bold text-[#1A1A1A] uppercase tracking-wider">
                                    Edit Credit Card Details
                                </h3>
                            </div>
                            <button
                                onClick={() => setEditingCc(null)}
                                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEditCc} className="space-y-4">
                            {/* Card Name */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Card Product Name / Label
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editCcForm.cardName}
                                    onChange={(e) => setEditCcForm(prev => ({ ...prev, cardName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-medium"
                                />
                            </div>

                            {/* Bank Selection */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Issuing Bank / Financial Institution
                                </label>
                                <select
                                    value={editCcForm.bankName}
                                    onChange={(e) => setEditCcForm(prev => ({ ...prev, bankName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none bg-white font-mono"
                                >
                                    {BANK_PRESETS.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>

                                {editCcForm.bankName === 'Other Bank' && (
                                    <div className="mt-2.5">
                                        <label className="text-[10px] font-mono uppercase font-bold text-[#088fff] block mb-1">
                                            Specify Your Bank Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Canara Bank, Union Bank, Bank of Baroda"
                                            value={editCcForm.customBankName || ''}
                                            onChange={(e) => setEditCcForm(prev => ({ ...prev, customBankName: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[#088fff] bg-blue-50/20 rounded-sm text-sm outline-none font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Network & Last 4 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Card Network
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {CC_NETWORKS.map(net => (
                                            <button
                                                key={net}
                                                type="button"
                                                onClick={() => setEditCcForm(prev => ({ ...prev, network: net }))}
                                                className={`py-1.5 text-xs font-mono font-bold rounded-sm border cursor-pointer transition-all ${
                                                    editCcForm.network === net
                                                        ? 'bg-[#088fff] text-white border-[#088fff]'
                                                        : 'bg-[#F9F8F5] text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:bg-[#1A1A1A]/10'
                                                }`}
                                            >
                                                {net}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Last 4 Digits
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="4"
                                        value={editCcForm.last4}
                                        onChange={(e) => setEditCcForm(prev => ({ ...prev, last4: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>
                            </div>

                            {/* Approved Limit & Current Balance */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Total Sanctioned Limit ({symbol})
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1000"
                                        value={editCcForm.creditLimit}
                                        onChange={(e) => setEditCcForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Current Statement Balance ({symbol})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editCcForm.currentBalance}
                                        onChange={(e) => setEditCcForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>
                            </div>

                            {/* Statement Day & Due Day */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Statement / Bill Day (1-31)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={editCcForm.statementDay}
                                        onChange={(e) => setEditCcForm(prev => ({ ...prev, statementDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                        Payment Due Day (1-31)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        value={editCcForm.dueDay}
                                        onChange={(e) => setEditCcForm(prev => ({ ...prev, dueDay: Math.min(31, Math.max(1, Number(e.target.value) || 1)) }))}
                                        className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono"
                                    />
                                </div>
                            </div>

                            {/* Cardholder Name */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Cardholder Name
                                </label>
                                <input
                                    type="text"
                                    value={editCcForm.holderName}
                                    onChange={(e) => setEditCcForm(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                                    className="w-full px-3 py-2 border border-[#1A1A1A]/20 rounded-sm text-sm outline-none focus:border-[#088fff] font-mono uppercase"
                                />
                            </div>

                            {/* Theme Gradient Finish */}
                            <div>
                                <label className="text-[10px] font-mono uppercase font-bold text-[#1A1A1A]/70 block mb-1">
                                    Metallic Card Sheen & Finish
                                </label>
                                <div className="grid grid-cols-7 gap-2 p-2 bg-[#F9F8F5] rounded-sm border border-[#1A1A1A]/10">
                                    {Object.entries(THEME_MAP).map(([key, item]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEditCcForm(prev => ({ ...prev, themeKey: key }))}
                                            title={item.name}
                                            className={`h-7 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                                                editCcForm.themeKey === key
                                                    ? 'ring-2 ring-[#088fff] ring-offset-2 scale-105 shadow-sm'
                                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                            }`}
                                            style={{ background: item.gradient }}
                                        >
                                            {editCcForm.themeKey === key && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 flex gap-3 border-t border-[#1A1A1A]/10">
                                <button
                                    type="button"
                                    onClick={() => setEditingCc(null)}
                                    className="w-1/2 py-2.5 border border-[#1A1A1A]/20 text-xs font-mono uppercase font-bold rounded-sm hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 py-2.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-mono uppercase font-bold rounded-sm transition-colors shadow cursor-pointer"
                                >
                                    Save & Update Card
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Confirm EMI Installment with Optional Cashflow Sync */}
            {payingEmiCard && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#F9F8F5] w-full max-w-md rounded-sm shadow-2xl border border-[#1A1A1A] p-6 relative text-[#1A1A1A] animate-in fade-in duration-200">
                        <button
                            type="button"
                            onClick={() => setPayingEmiCard(null)}
                            className="absolute top-4 right-4 text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#088fff]">
                                LOAN CYCLE SETTLEMENT
                            </span>
                        </div>

                        <h3 className="text-xl font-editorial font-bold text-[#1A1A1A] mb-1">
                            {payingEmiCard.title}
                        </h3>

                        <p className="text-xs text-[#1A1A1A]/70 mb-5 font-light">
                            Advancing installment <strong className="font-semibold text-[#1A1A1A]">{(payingEmiCard.paidInstallments || 0) + 1}</strong> of <strong className="font-semibold text-[#1A1A1A]">{payingEmiCard.tenureMonths || 12}</strong>.
                        </p>

                        {/* Payment Summary Box */}
                        <div className="bg-white border border-[#1A1A1A]/10 p-4 rounded-sm mb-5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] uppercase font-mono text-[#1A1A1A]/50 block">Installment Due</span>
                                <span className="text-2xl font-editorial font-bold text-[#1A1A1A]">
                                    {formatCurrency(Number(typeof payingEmiCard.numericAmount === 'number' ? payingEmiCard.numericAmount : String(payingEmiCard.amount || '').replace(/[^0-9.]/g, '') || 0))}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-mono uppercase text-[#088fff] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                                    Cycle {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Optional Cashflow Sync Checkbox */}
                        <label className="flex items-start gap-3 p-3.5 bg-white border border-[#1A1A1A]/10 rounded-sm cursor-pointer hover:border-[#088fff]/50 transition-colors mb-6 group select-none">
                            <input
                                type="checkbox"
                                checked={logToCashflow}
                                onChange={(e) => setLogToCashflow(e.target.checked)}
                                className="mt-0.5 w-4 h-4 text-[#088fff] rounded border-gray-300 focus:ring-[#088fff] cursor-pointer"
                            />
                            <div className="flex-1">
                                <span className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#088fff] transition-colors block">
                                    Also record as an expense under "EMI & Loans" in cashflow
                                </span>
                                <span className="text-[11px] text-[#1A1A1A]/60 leading-relaxed block mt-0.5">
                                    Deducts from this month's net savings balance. Keep unchecked if you want this tracked solely on your loan ledger without affecting liquid cash.
                                </span>
                            </div>
                        </label>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A1A1A]/10">
                            <button
                                type="button"
                                onClick={() => setPayingEmiCard(null)}
                                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmMarkPaid}
                                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#088fff] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                <span>Confirm & Settle</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Loan Obligation Modal */}
            <ConfirmDeleteModal
                isOpen={Boolean(pendingDeleteLoan)}
                onClose={() => setPendingDeleteLoan(null)}
                onConfirm={() => {
                    if (pendingDeleteLoan) {
                        handleDeleteCard(pendingDeleteLoan.id);
                        setPendingDeleteLoan(null);
                    }
                }}
                title="Delete Loan Obligation?"
                itemName={pendingDeleteLoan?.title}
                itemDetails={pendingDeleteLoan ? `${formatCurrency(Number(pendingDeleteLoan.numericAmount))}/mo • ${pendingDeleteLoan.cardType}` : ''}
                message="Are you sure you want to remove this loan obligation? This will remove its EMI from your debt schedule and financial health score."
                confirmText="Remove Loan"
            />

            {/* Confirm Delete Credit Card Modal */}
            <ConfirmDeleteModal
                isOpen={Boolean(pendingDeleteCc)}
                onClose={() => setPendingDeleteCc(null)}
                onConfirm={() => {
                    if (pendingDeleteCc) {
                        handleDeleteCc(pendingDeleteCc);
                        setPendingDeleteCc(null);
                    }
                }}
                title="Delete Credit Card?"
                itemName={pendingDeleteCc ? `${pendingDeleteCc.bankName} ${pendingDeleteCc.cardName}` : ''}
                itemDetails={pendingDeleteCc ? `Ending in ${pendingDeleteCc.last4 || '****'} • Limit: ${formatCurrency(Number(pendingDeleteCc.creditLimit || 0))}` : ''}
                message="Are you sure you want to remove this credit card from your ledger? Its balance and billing tracking will be removed."
                confirmText="Remove Card"
            />

            <GetStartedModal
                isOpen={isGetStartedOpen}
                onClose={() => setIsGetStartedOpen(false)}
            />
        </div>
    );
};

export default EmiStudioPage;
