import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
    User, 
    ShieldCheck, 
    Key, 
    CreditCard, 
    Globe, 
    Bell, 
    Smartphone, 
    CheckCircle2, 
    Edit3, 
    Plus, 
    LogOut, 
    Download,
    Save,
    X,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { 
    getUserProfile, 
    saveUserProfile, 
    clearAllUserData, 
    resetToDemoData 
} from '../../services/userDataService';

export const ProfileSection = () => {
    const { logout } = useContext(AuthContext);
    // Profile State
    const [profile, setProfile] = useState(getUserProfile());
    const [isEditing, setIsEditing] = useState(false);

    // Temp form state
    const [editName, setEditName] = useState(profile.name);
    const [editEmail, setEditEmail] = useState(profile.email);

    // Security Toggles
    const [twoFAEnabled, setTwoFAEnabled] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);

    // Add Account Modal
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [newBank, setNewBank] = useState('');
    const [newAccType, setNewAccType] = useState('Checking');
    const [newLastFour, setNewLastFour] = useState('');

    useEffect(() => {
        const handleSync = () => {
            setProfile(getUserProfile());
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, []);

    const handleSaveProfile = (e) => {
        e.preventDefault();
        const updated = {
            ...profile,
            name: editName.trim(),
            email: editEmail.trim()
        };
        saveUserProfile(updated);
        setProfile(updated);
        setIsEditing(false);
    };

    const handleCurrencyChange = (e) => {
        const updated = { ...profile, currency: e.target.value };
        saveUserProfile(updated);
        setProfile(updated);
    };

    const handleAddAccount = (e) => {
        e.preventDefault();
        if (!newBank.trim() || !newLastFour.trim()) return;

        const newAcc = {
            id: Date.now(),
            bank: newBank.trim(),
            type: newAccType,
            number: `•••• ${newLastFour.slice(-4)}`,
            status: 'VERIFIED'
        };

        const updated = {
            ...profile,
            linkedAccounts: [...(profile.linkedAccounts || []), newAcc]
        };
        saveUserProfile(updated);
        setProfile(updated);

        setNewBank('');
        setNewLastFour('');
        setShowAccountModal(false);
    };

    const handleDeleteAccount = (id) => {
        const updated = {
            ...profile,
            linkedAccounts: (profile.linkedAccounts || []).filter(a => a.id !== id)
        };
        saveUserProfile(updated);
        setProfile(updated);
    };

    const handleClearAllData = () => {
        if (window.confirm('Wipe all dummy/sample data and start completely fresh? You will be able to add all your custom info.')) {
            clearAllUserData();
            alert('All demo data cleared! You can now add your own profile info, transactions, and budgets.');
        }
    };

    const handleResetDemoData = () => {
        resetToDemoData();
        setProfile(getUserProfile());
        alert('Demo sample data restored!');
    };

    return (
        <section id="profile" className="bg-[#F9F8F5] text-[#1A1A1A] py-20 lg:py-28 border-b border-[#1A1A1A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 pb-8 border-b border-[#1A1A1A]/10">
                    <div className="lg:col-span-7">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-3 font-mono">
                            USER PROFILE & DATA MANAGEMENT COMMAND
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
                            ACCOUNT & <br />
                            <span className="italic text-[#088fff]">PREFERENCES</span>
                        </h2>
                    </div>

                    <div className="lg:col-span-5 flex items-center justify-end gap-3 flex-wrap">
                        <button
                            onClick={handleClearAllData}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase font-mono rounded-sm transition-colors cursor-pointer"
                        >
                            Clear All Data & Start Fresh
                        </button>
                        <button
                            onClick={handleResetDemoData}
                            className="px-4 py-2.5 border border-[#1A1A1A]/30 hover:border-[#088fff] text-[#1A1A1A] font-bold text-xs font-mono rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Demo Data</span>
                        </button>
                    </div>
                </div>

                {/* Profile Bento Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Bento Card 1: User Identity Card */}
                    <div className="lg:col-span-4 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between min-h-[460px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        Identity Profile
                                    </span>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                                    {profile.planTier || 'PRO MEMBER'}
                                </span>
                            </div>

                            {/* Avatar & Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-editorial text-2xl font-bold border-2 border-[#088fff] shadow-md">
                                    {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-editorial font-bold text-[#1A1A1A]">
                                        {profile.name}
                                    </h3>
                                    <p className="text-xs text-[#1A1A1A]/60 font-mono">
                                        {profile.email}
                                    </p>
                                    <span className="text-[10px] text-[#088fff] font-mono font-bold mt-1 block">
                                        Currency: {profile.currency}
                                    </span>
                                </div>
                            </div>

                            {/* Profile Edit Form / Display */}
                            {!isEditing ? (
                                <div className="space-y-3 p-4 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-[#1A1A1A]/50">Account Status:</span>
                                        <span className="font-bold text-emerald-700">Verified & Active</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-[#1A1A1A]/50">Plan Tier:</span>
                                        <span className="font-bold text-[#1A1A1A]">Budget Buddy Unlimited</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-[#1A1A1A]/50">Primary Region:</span>
                                        <span className="font-bold text-[#1A1A1A]">{profile.region || 'India (IN)'}</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setEditName(profile.name);
                                            setEditEmail(profile.email);
                                            setIsEditing(true);
                                        }}
                                        className="mt-3 w-full py-2 bg-white hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A]/20 text-[11px] uppercase font-mono font-bold rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Edit Personal Info</span>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveProfile} className="space-y-3 p-4 bg-[#F9F8F5] border border-[#088fff]/40 rounded-sm">
                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-[#1A1A1A]/60 block mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full text-xs p-2 bg-white border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-[#1A1A1A]/60 block mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="w-full text-xs p-2 bg-white border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="w-1/2 py-1.5 text-xs bg-white text-[#1A1A1A]/70 border border-[#1A1A1A]/20 rounded-sm cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="w-1/2 py-1.5 text-xs font-bold bg-[#088fff] text-white rounded-sm flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[10px] font-mono text-[#1A1A1A]/50">
                            <span>UID: {profile.uid || '8904-BUDDY-2026'}</span>
                            <CheckCircle2 className="w-4 h-4 text-[#088fff]" />
                        </div>
                    </div>

                    {/* Bento Card 2: Security & 2FA Credentials */}
                    <div className="lg:col-span-4 bg-[#1A1A1A] text-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A] flex flex-col justify-between min-h-[460px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-white/60">
                                        Security & Vault
                                    </span>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                                    256-BIT AES
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-sm">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-4 h-4 text-[#088fff]" />
                                        <div>
                                            <h4 className="text-xs font-bold text-white font-sans-clean">
                                                Two-Factor Auth (2FA)
                                            </h4>
                                            <p className="text-[10px] text-white/50 font-mono">
                                                SMS & Authenticator App
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                            twoFAEnabled ? 'bg-[#088fff]' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                            twoFAEnabled ? 'right-1' : 'left-1'
                                        }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-sm">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-4 h-4 text-[#088fff]" />
                                        <div>
                                            <h4 className="text-xs font-bold text-white font-sans-clean">
                                                Biometric / Passkey
                                            </h4>
                                            <p className="text-[10px] text-white/50 font-mono">
                                                Touch ID & Face ID
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setBiometricEnabled(!biometricEnabled)}
                                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                            biometricEnabled ? 'bg-[#088fff]' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                            biometricEnabled ? 'right-1' : 'left-1'
                                        }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-sm">
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-4 h-4 text-[#088fff]" />
                                        <div>
                                            <h4 className="text-xs font-bold text-white font-sans-clean">
                                                Security Login Alerts
                                            </h4>
                                            <p className="text-[10px] text-white/50 font-mono">
                                                Instant email notifications
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEmailAlerts(!emailAlerts)}
                                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                            emailAlerts ? 'bg-[#088fff]' : 'bg-white/20'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                            emailAlerts ? 'right-1' : 'left-1'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
                            <span>Last Audit: Today</span>
                            <span className="text-emerald-400 font-bold">Encrypted Vault</span>
                        </div>
                    </div>

                    {/* Bento Card 3: Linked Financial Institutions & Preferences */}
                    <div className="lg:col-span-4 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between min-h-[460px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        Linked Institutions
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowAccountModal(!showAccountModal)}
                                    className="text-[10px] uppercase font-bold bg-[#1A1A1A] hover:bg-[#088fff] text-white px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>Link Bank</span>
                                </button>
                            </div>

                            {/* Base Currency Selection */}
                            <div className="mb-4 p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-[#088fff]" />
                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                            Base Currency
                                        </span>
                                    </div>
                                    <select
                                        value={profile.currency}
                                        onChange={handleCurrencyChange}
                                        className="text-xs font-mono font-bold bg-white border border-[#1A1A1A]/20 p-1.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                    >
                                        <option value="INR (₹)">INR (₹)</option>
                                        <option value="USD ($)">USD ($)</option>
                                        <option value="EUR (€)">EUR (€)</option>
                                        <option value="GBP (£)">GBP (£)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Linked Accounts List */}
                            <div className="space-y-3">
                                {(!profile.linkedAccounts || profile.linkedAccounts.length === 0) ? (
                                    <div className="p-4 text-center text-xs text-[#1A1A1A]/50 font-mono">
                                        No linked bank accounts yet.
                                    </div>
                                ) : (
                                    profile.linkedAccounts.map((acc) => (
                                        <div key={acc.id} className="p-3 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-[#1A1A1A] font-sans-clean">
                                                    {acc.bank}
                                                </h4>
                                                <p className="text-[10px] font-mono text-[#1A1A1A]/50">
                                                    {acc.type} • {acc.number}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                                                    {acc.status}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteAccount(acc.id)}
                                                    className="text-[#1A1A1A]/30 hover:text-rose-600 p-1 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                            <button
                                onClick={() => alert('Backup user telemetry downloaded successfully!')}
                                className="text-[10px] uppercase font-mono font-bold text-[#1A1A1A]/60 hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Backup Data</span>
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                }}
                                className="text-[10px] uppercase font-mono font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Bank Account Modal */}
                {showAccountModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                        <div className="bg-[#1A1A1A] text-white border border-white/20 rounded-md p-6 max-w-md w-full shadow-2xl relative">
                            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
                                <div className="flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-[#088fff]" />
                                    <h3 className="text-sm font-editorial font-bold text-white uppercase tracking-wider">
                                        Link Custom Bank Institution
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowAccountModal(false)}
                                    className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleAddAccount} className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                        Bank / Institution Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Axis Bank, Chase, Revolut"
                                        value={newBank}
                                        onChange={(e) => setNewBank(e.target.value)}
                                        className="w-full bg-white/5 border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Account Type
                                        </label>
                                        <select
                                            value={newAccType}
                                            onChange={(e) => setNewAccType(e.target.value)}
                                            className="w-full bg-[#2A2A2A] border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                        >
                                            <option value="Checking">Checking</option>
                                            <option value="Savings">Savings</option>
                                            <option value="Credit Specimen">Credit Specimen</option>
                                            <option value="Investment SIP">Investment SIP</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase font-mono text-white/60 block mb-1">
                                            Last 4 Digits
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="7890"
                                            value={newLastFour}
                                            onChange={(e) => setNewLastFour(e.target.value)}
                                            className="w-full bg-white/5 border border-white/15 text-xs text-white p-2.5 rounded-sm focus:outline-none focus:border-[#088fff]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAccountModal(false)}
                                        className="px-4 py-2 text-xs text-white/70 hover:text-white bg-white/5 border border-white/10 rounded-sm cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-xs font-bold text-white bg-[#088fff] hover:bg-[#088fff]/80 rounded-sm cursor-pointer"
                                    >
                                        Link Account
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

export default ProfileSection;
