import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
    User, 
    Globe, 
    Edit3, 
    LogOut, 
    Save, 
    CheckCircle2,
    Lock
} from 'lucide-react';
import { 
    getUserProfile, 
    saveUserProfile, 
    clearAllUserData, 
    DEFAULT_USER_PROFILE
} from '../../services/userDataService';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';

export const ProfileSection = () => {
    const navigate = useNavigate();
    const { logout, updateProfile, user } = useContext(AuthContext);

    // Profile State
    const [profile, setProfile] = useState(() => getUserProfile());
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // Temp form state
    const [editName, setEditName] = useState(profile.name || user?.name || '');

    // Delete and Wipe Confirmation State
    const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile(user);
            if (!isEditing) {
                setEditName(user.name);
            }
        }
    }, [user, isEditing]);

    useEffect(() => {
        const handleSync = () => {
            const p = getUserProfile();
            setProfile(p);
            if (!isEditing) {
                setEditName(p.name);
            }
        };
        window.addEventListener('userDataChanged', handleSync);
        return () => window.removeEventListener('userDataChanged', handleSync);
    }, [isEditing]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage(null);
        try {
            const updated = {
                name: editName.trim()
            };
            const res = await updateProfile(updated);
            if (res?.success) {
                setProfile(res.user);
                setEditName(res.user.name);
                setIsEditing(false);
                setSaveMessage({ type: 'success', text: 'Personal info updated successfully!' });
                setTimeout(() => setSaveMessage(null), 3500);
            } else {
                setSaveMessage({ type: 'error', text: res?.message || 'Failed to update profile.' });
            }
        } catch (err) {
            setSaveMessage({ type: 'error', text: err.message || 'Error saving changes' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
        const updated = { ...profile, currency: newCurrency };
        saveUserProfile(updated);
        setProfile(updated);
        await updateProfile({ currency: newCurrency });
    };

    const handleClearAllData = () => {
        clearAllUserData();
        if (profile?.email) {
            saveUserProfile({
                ...DEFAULT_USER_PROFILE,
                name: profile.name,
                email: profile.email
            });
        }
        setProfile(getUserProfile());
        setIsConfirmClearAllOpen(false);
    };

    return (
        <section id="profile" className="bg-[#F9F8F5] text-[#1A1A1A] pt-4 pb-20 lg:pt-6 lg:pb-24 border-b border-[#1A1A1A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Editorial Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-10 pb-6 border-b border-[#1A1A1A]/10">
                    <div className="lg:col-span-7">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-3 font-mono">
                            USER PROFILE & ACCOUNT PREFERENCES
                        </span>
                        <h2 className="text-4xl sm:text-6xl font-medium tracking-tight font-editorial text-[#1A1A1A] leading-tight">
                            ACCOUNT & <br />
                            <span className="italic text-[#088fff]">PREFERENCES</span>
                        </h2>
                    </div>

                    <div className="lg:col-span-5 flex items-center justify-end gap-3 flex-wrap">
                        <button
                            onClick={() => setIsConfirmClearAllOpen(true)}
                            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase font-mono rounded-sm transition-colors cursor-pointer"
                        >
                            Clear All Data & Start Fresh
                        </button>
                    </div>
                </div>

                {/* Profile Bento Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Bento Card 1: User Identity Card */}
                    <div className="lg:col-span-6 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between min-h-[420px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        Identity Profile
                                    </span>
                                </div>
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
                                        <span className="text-[#1A1A1A]/50">Primary Region:</span>
                                        <span className="font-bold text-[#1A1A1A]">{profile.region || 'India (IN)'}</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setEditName(profile.name);
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
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] uppercase font-mono text-[#1A1A1A]/60">Email Address</label>
                                            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                                                <Lock className="w-2.5 h-2.5 text-zinc-500" /> Primary ID (Locked)
                                            </span>
                                        </div>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            readOnly
                                            disabled
                                            className="w-full text-xs p-2 bg-zinc-100 text-[#1A1A1A]/70 border border-[#1A1A1A]/15 rounded-sm cursor-not-allowed select-none font-mono"
                                            title="Email address is your primary security credential and cannot be modified."
                                        />
                                        <span className="text-[10px] text-[#1A1A1A]/50 font-mono mt-1 block">
                                            Email address is permanently bound to your account credentials for security.
                                        </span>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => setIsEditing(false)}
                                            className="w-1/2 py-1.5 text-xs bg-white text-[#1A1A1A]/70 border border-[#1A1A1A]/20 rounded-sm cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-1/2 py-1.5 text-xs font-bold bg-[#088fff] hover:bg-[#088fff]/90 text-white rounded-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {saveMessage && (
                                <div className={`mt-3 p-2.5 rounded-sm text-xs font-mono flex items-center gap-2 animate-fadeIn ${
                                    saveMessage.type === 'success' 
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                                        : 'bg-rose-50 text-rose-800 border border-rose-300'
                                }`}>
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>{saveMessage.text}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bento Card 2: Account Preferences & Security */}
                    <div className="lg:col-span-6 bg-white rounded-sm p-6 sm:p-8 shadow-xl border border-[#1A1A1A]/15 flex flex-col justify-between min-h-[420px] relative">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]/10 mb-6">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#088fff]" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold font-mono text-[#1A1A1A]/60">
                                        Account Preferences
                                    </span>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                                    ACTIVE
                                </span>
                            </div>

                            {/* Base Currency Selection */}
                            <div className="p-4 bg-[#F9F8F5] border border-[#1A1A1A]/10 rounded-sm">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-bold text-[#1A1A1A] font-sans-clean block">
                                            Base Currency
                                        </span>
                                        <span className="text-[10px] text-[#1A1A1A]/60 font-mono">
                                            Applied to ledgers, budgets & reports
                                        </span>
                                    </div>
                                    <select
                                        value={profile.currency}
                                        onChange={handleCurrencyChange}
                                        className="text-xs font-mono font-bold bg-white border border-[#1A1A1A]/20 p-2 rounded-sm focus:outline-none focus:border-[#088fff]"
                                    >
                                        <option value="INR (₹)">INR (₹)</option>
                                        <option value="USD ($)">USD ($)</option>
                                        <option value="EUR (€)">EUR (€)</option>
                                        <option value="GBP (£)">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer - Clean Sign Out */}
                        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-end">
                            <button
                                onClick={async () => {
                                    await logout();
                                    navigate('/');
                                }}
                                className="text-xs uppercase font-mono font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded hover:bg-rose-50 transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Wipe All User Data Modal */}
            <ConfirmDeleteModal
                isOpen={isConfirmClearAllOpen}
                onClose={() => setIsConfirmClearAllOpen(false)}
                onConfirm={handleClearAllData}
                title="Wipe All Personal Data?"
                itemName="Complete Financial Profile & Ledgers"
                itemDetails="All recorded transactions, savings vaults, and category budgets"
                message="Are you sure you want to permanently clear all stored user data and start completely fresh? This cannot be undone."
                confirmText="Wipe Everything"
                dangerLevel="high"
            />
        </section>
    );
};

export default ProfileSection;
