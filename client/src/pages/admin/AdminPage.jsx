import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart,
  BarChart3,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Crown,
  Award,
  Search,
  Wallet,
  CreditCard,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  Download,
  Trash2,
  Star,
  Copy,
  Check,
  MessageSquare,
  ShieldAlert,
  FileText,
  AlertTriangle
} from 'lucide-react';
import adminService, { ADMIN_TOKEN_KEY } from '../../services/adminService';

// Category color badges
const CATEGORY_COLORS = {
  Food: 'bg-amber-100 text-amber-800 border-amber-300',
  Groceries: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Shopping: 'bg-purple-100 text-purple-800 border-purple-300',
  Utilities: 'bg-blue-100 text-blue-800 border-blue-300',
  Entertainment: 'bg-pink-100 text-pink-800 border-pink-300',
  Transport: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  Travel: 'bg-sky-100 text-sky-800 border-sky-300',
  Healthcare: 'bg-rose-100 text-rose-800 border-rose-300',
  Education: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Salary: 'bg-green-100 text-green-800 border-green-300',
  Investments: 'bg-teal-100 text-teal-800 border-teal-300',
  Freelance: 'bg-violet-100 text-violet-800 border-violet-300',
  Other: 'bg-gray-100 text-gray-800 border-gray-300'
};

const GOOGLE_SHEET_WEBHOOK_URL =
  import.meta.env.VITE_GOOGLE_SHEET_CONTACT_URL ||
  'https://script.google.com/macros/s/AKfycbxb6h9n32BFfJcvI9nChInj_dOlMURbuu9RIBNkOtpxS-8TB8d7jIQKr1ec0gMQVqk/exec';

export const AdminPage = () => {
  // Authentication State
  const [isAdminAuth, setIsAdminAuth] = useState(adminService.isAuthenticated());
  const [adminProfile, setAdminProfile] = useState(adminService.getProfile());

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active View Tab: 'overview' | 'spending' | 'users' | 'leaderboard' | 'live' | 'feedback'
  const [activeTab, setActiveTab] = useState('overview');

  // Admin Telemetry Data
  const [overview, setOverview] = useState(null);
  const [spending, setSpending] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [topCustomers, setTopCustomers] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);

  // Feedback Response Sheet Data
  const [feedbackData, setFeedbackData] = useState({
    stats: { totalCount: 0, newCount: 0, reviewedCount: 0, resolvedCount: 0, totalTestimonials: 0 },
    sheetRows: [],
    testimonials: []
  });
  const [feedbackSubTab, setFeedbackSubTab] = useState('sheet'); // 'sheet' | 'testimonials' | 'webhook'
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('ALL');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('ALL'); // 'ALL' | 'complaint' | 'inquiry'
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // UI & Live Sync States
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('ALL');

  const pollIntervalRef = useRef(null);

  // Auto-fill default admin credentials helper
  const handleQuickFill = () => {
    setLoginEmail('admin@budgetbuddy.app');
    setLoginPassword('AdminMaster2026!#');
    setLoginError('');
  };

  // Perform Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter both administrative email and password.');
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginError('');
      const res = await adminService.login(loginEmail.trim(), loginPassword);
      if (res.success) {
        setIsAdminAuth(true);
        setAdminProfile(res.admin || adminService.getProfile());
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid administrative credentials or insufficient authorization.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Perform Admin Logout
  const handleAdminLogout = () => {
    adminService.logout();
    setIsAdminAuth(false);
    setAdminProfile(null);
    setOverview(null);
    setSpending(null);
    setUsersList([]);
    setTopCustomers(null);
    setLiveFeed([]);
    setFeedbackData({
      stats: { totalCount: 0, newCount: 0, reviewedCount: 0, resolvedCount: 0, totalTestimonials: 0 },
      sheetRows: [],
      testimonials: []
    });
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  // Fetch full admin platform data
  const loadPlatformData = useCallback(async (isSilent = false) => {
    if (!isAdminAuth) return;
    if (!isSilent) setRefreshing(true);

    try {
      const [ovRes, spRes, usRes, tcRes, lfRes, fbRes] = await Promise.allSettled([
        adminService.getOverview(),
        adminService.getSpendingBreakdown(),
        adminService.getUsers(),
        adminService.getTopCustomers(),
        adminService.getLiveFeed(),
        adminService.getFeedbackSheet()
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value.success) {
        setOverview(ovRes.value.data);
      }
      if (spRes.status === 'fulfilled' && spRes.value.success) {
        setSpending(spRes.value);
      }
      if (usRes.status === 'fulfilled' && usRes.value.success) {
        setUsersList(usRes.value.users || []);
      }
      if (tcRes.status === 'fulfilled' && tcRes.value.success) {
        setTopCustomers(tcRes.value);
      }
      if (lfRes.status === 'fulfilled' && lfRes.value.success) {
        setLiveFeed(lfRes.value.feed || []);
      }
      if (fbRes.status === 'fulfilled' && fbRes.value.success) {
        setFeedbackData(fbRes.value);
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to update admin telemetry:', err);
    } finally {
      if (!isSilent) setRefreshing(false);
      setLoading(false);
    }
  }, [isAdminAuth]);

  // Initial load when admin enters
  useEffect(() => {
    if (isAdminAuth) {
      setLoading(true);
      loadPlatformData(false);
    }
  }, [isAdminAuth, loadPlatformData]);

  // Real-time polling ticker (every 6 seconds for live feed + stats)
  useEffect(() => {
    if (isAdminAuth && autoRefresh) {
      pollIntervalRef.current = setInterval(() => {
        // Fetch live feed, overview, and feedback quietly
        Promise.allSettled([
          adminService.getLiveFeed(),
          adminService.getOverview(),
          adminService.getFeedbackSheet()
        ]).then(([feedRes, ovRes, fbRes]) => {
          if (feedRes.status === 'fulfilled' && feedRes.value.success) {
            setLiveFeed(feedRes.value.feed || []);
          }
          if (ovRes.status === 'fulfilled' && ovRes.value.success) {
            setOverview(ovRes.value.data);
          }
          if (fbRes.status === 'fulfilled' && fbRes.value.success) {
            setFeedbackData(fbRes.value);
          }
          setLastSyncTime(new Date());
        });
      }, 6000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isAdminAuth, autoRefresh]);

  // Feedback Resolution Status Handler
  const handleFeedbackStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingFeedbackId(id);
      const res = await adminService.updateFeedbackStatus(id, newStatus);
      if (res.success) {
        setFeedbackData((prev) => ({
          ...prev,
          sheetRows: prev.sheetRows.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
          stats: {
            ...prev.stats,
            newCount: prev.sheetRows.filter((r) => (r.id === id ? newStatus === 'New' : r.status === 'New')).length,
            reviewedCount: prev.sheetRows.filter((r) => (r.id === id ? newStatus === 'Reviewed' : r.status === 'Reviewed')).length,
            resolvedCount: prev.sheetRows.filter((r) => (r.id === id ? newStatus === 'Resolved' : r.status === 'Resolved')).length
          }
        }));
      }
    } catch (err) {
      alert(`Failed to update feedback status: ${err.message || 'Network error'}`);
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  // Feedback Delete Handler
  const handleFeedbackDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this response from the feedback sheet?')) return;
    try {
      const res = await adminService.deleteFeedback(id);
      if (res.success) {
        setFeedbackData((prev) => ({
          ...prev,
          sheetRows: prev.sheetRows.filter((r) => r.id !== id),
          stats: {
            ...prev.stats,
            totalCount: Math.max(0, prev.stats.totalCount - 1)
          }
        }));
      }
    } catch (err) {
      alert(`Failed to delete feedback row: ${err.message || 'Network error'}`);
    }
  };

  // Purge Sample Test Data
  const handlePurgeSamples = async () => {
    if (!window.confirm('Are you sure you want to purge all pre-seeded sample test records? All real user complaints and inquiries will remain.')) return;
    try {
      const res = await adminService.purgeSampleFeedback();
      if (res.success) {
        alert(res.message || 'Sample test records successfully purged.');
        loadPlatformData(false);
      }
    } catch (err) {
      alert(`Purge failed: ${err.message || 'Network error'}`);
    }
  };

  // Export Sheet to CSV
  const handleExportCSV = () => {
    if (!feedbackData?.sheetRows?.length) return;
    const headers = ['Row', 'Ticket ID', 'Type', 'Severity', 'Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Rating', 'Status', 'Source'];
    const rows = feedbackData.sheetRows.map((r, i) => [
      i + 1,
      `"${r.ticketId || ''}"`,
      `"${r.type || 'inquiry'}"`,
      `"${r.severity || 'Medium'}"`,
      `"${r.timestamp}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${r.phone || ''}"`,
      `"${(r.subject || '').replace(/"/g, '""')}"`,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      r.rating || 5,
      `"${r.status || 'New'}"`,
      `"${(r.source || 'Web').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BudgetBuddy_Feedback_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesSegment = segmentFilter === 'ALL' || user.segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  // Filtered Feedback Sheet Rows
  const filteredFeedbackRows = (feedbackData.sheetRows || []).filter((item) => {
    const q = feedbackSearch.toLowerCase();
    const matchesSearch =
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      item.ticketId?.toLowerCase().includes(q);

    const matchesStatus = feedbackStatusFilter === 'ALL' || item.status === feedbackStatusFilter;

    const matchesType =
      feedbackTypeFilter === 'ALL' ||
      (feedbackTypeFilter === 'complaint' && (item.type === 'complaint' || item.ticketId?.startsWith('CMP') || item.subject?.toLowerCase().includes('complaint'))) ||
      (feedbackTypeFilter === 'inquiry' && item.type !== 'complaint' && !item.ticketId?.startsWith('CMP') && !item.subject?.toLowerCase().includes('complaint'));

    return matchesSearch && matchesStatus && matchesType;
  });

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN (ISOLATED CREDENTIALS)
  // =========================================================================
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col justify-between selection:bg-[#088fff] selection:text-white font-sans">
        {/* Top Minimal Admin Header */}
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#088fff] to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-[#088fff]/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-lg tracking-wide font-bold">BUDGET BUDDY</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/70 font-semibold tracking-wider">
                  EXEC PORTAL
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Atlas MongoDB Cluster</span>
          </div>
        </header>

        {/* Center Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111622]/90 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#088fff]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="text-center mb-8 relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#088fff]/20 to-indigo-500/10 border border-[#088fff]/30 mb-4 shadow-inner">
                <Lock className="w-7 h-7 text-[#088fff]" />
              </div>
              <h2 className="text-2xl font-bold font-editorial text-white tracking-tight">
                Operations & Governance
              </h2>
              <p className="text-sm text-white/60 mt-1 font-sans">
                Enter your administrative credentials to access real-time telemetry, platform ledger, and customer analytics.
              </p>
            </div>

            {/* Quick Fill One-Click Badge */}
            <div className="mb-6 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#088fff] font-bold block">
                  AUTHORIZED ADMIN IDENTITY
                </span>
                <div className="text-white/80 font-mono">admin@budgetbuddy.app</div>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-3 py-1.5 rounded-lg bg-[#088fff]/20 hover:bg-[#088fff]/30 text-[#088fff] font-medium border border-[#088fff]/40 transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill Pass
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 font-mono uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@budgetbuddy.app"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#088fff] focus:ring-1 focus:ring-[#088fff] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5 font-mono uppercase tracking-wider">
                  Root Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#088fff] focus:ring-1 focus:ring-[#088fff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#088fff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-[#088fff]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-sans cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Root Access...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In to Executive Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <a
                href="/"
                className="text-xs text-white/50 hover:text-white/90 transition-colors inline-flex items-center gap-1"
              >
                ← Return to Client Portal
              </a>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="border-t border-white/10 px-6 py-3 text-center text-xs text-white/40 font-mono">
          BUDGET BUDDY ENTERPRISE SUITE • ZERO-REGRESSION SECURE ISOLATION
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED EXECUTIVE ADMIN COMMAND CENTER
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col font-sans selection:bg-[#088fff] selection:text-white">
      {/* Top Operations Header */}
      <header className="sticky top-0 z-50 bg-[#0E131F]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-[1800px] w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#088fff] to-indigo-600 flex items-center justify-center shadow-lg shadow-[#088fff]/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-xl font-bold tracking-wide">
                  BUDGET BUDDY <span className="text-[#088fff] italic">OPERATIONS</span>
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ATLAS SYNC
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">
                Session: {adminProfile?.email || 'admin@budgetbuddy.app'} (Root Privileges)
              </p>
            </div>
          </div>

          {/* Action Bar (Live Sync, Manual Refresh, Logout) */}
          <div className="flex items-center gap-3">
            {/* Auto-Refresh Live Pill */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              {autoRefresh ? 'LIVE (6s Auto)' : 'PAUSED'}
            </button>

            {/* Manual Sync */}
            <button
              onClick={() => loadPlatformData(false)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              title="Force Sync Now"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#088fff]' : ''}`} />
            </button>

            {/* Link to Client View */}
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>User App</span>
            </a>

            {/* Logout */}
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Including New Feedback Response Sheet Tab) */}
        <div className="max-w-[1800px] w-full mx-auto mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/5">
          {[
            { id: 'overview', label: 'Overview & Telemetry', icon: Activity },
            { id: 'spending', label: 'Spending & Categories', icon: PieChart },
            { id: 'users', label: 'Customer Segmentation', icon: Users },
            { id: 'leaderboard', label: 'Top Customers', icon: Crown },
            { id: 'live', label: 'Real-Time Feed', icon: Sparkles },
            {
              id: 'feedback',
              label: `Feedback Sheet ${feedbackData.stats.newCount > 0 ? `(${feedbackData.stats.newCount} New)` : ''}`,
              icon: FileSpreadsheet,
              badge: feedbackData.stats.newCount > 0
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#088fff] text-white shadow-md shadow-[#088fff]/25 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Ribbon (Always visible across all tabs for instant pulse) */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Card 1: Users */}
          <div className="bg-[#111622] border border-white/10 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase mb-2">
              <span>Platform Users</span>
              <Users className="w-4 h-4 text-[#088fff]" />
            </div>
            <div className="text-2xl font-bold font-editorial text-white">
              {overview ? overview.totalUsers : '...'}
            </div>
            <span className="text-[11px] text-white/50 mt-1 block">Registered in Atlas DB</span>
          </div>

          {/* Card 2: Total Platform Volume */}
          <div className="bg-[#111622] border border-white/10 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase mb-2">
              <span>Transacted Vol</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-editorial text-white">
              ₹{overview ? (overview.totalVolume || 0).toLocaleString('en-IN') : '...'}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              Inflow + Outflow aggregate
            </span>
          </div>

          {/* Card 3: Platform Inflow */}
          <div className="bg-[#111622] border border-white/10 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase mb-2">
              <span>Gross Inflow</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-editorial text-emerald-400">
              ₹{overview ? (overview.totalInflow || 0).toLocaleString('en-IN') : '...'}
            </div>
            <span className="text-[11px] text-white/50 mt-1 block">Deposits & Income</span>
          </div>

          {/* Card 4: Platform Outflow */}
          <div className="bg-[#111622] border border-white/10 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase mb-2">
              <span>Total Outflow</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-editorial text-rose-400">
              ₹{overview ? (overview.totalOutflow || 0).toLocaleString('en-IN') : '...'}
            </div>
            <span className="text-[11px] text-white/50 mt-1 block">Total expenses recorded</span>
          </div>

          {/* Card 5: Vault Reserves */}
          <div className="bg-[#111622] border border-white/10 rounded-xl p-4 relative overflow-hidden col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-white/50 text-xs font-mono uppercase mb-2">
              <span>Vault Reserves</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-editorial text-amber-300">
              ₹{overview ? (overview.totalVaultReserves || 0).toLocaleString('en-IN') : '...'}
            </div>
            <span className="text-[11px] text-white/50 mt-1 block">Emergency Funds Locked</span>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cashflow Monthly Trajectory */}
              <div className="lg:col-span-2 bg-[#111622] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#088fff]" />
                      Platform Cashflow Momentum (Last 6 Months)
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Comparing cross-account income deposits against spend outflow
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Inflow
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Outflow
                    </span>
                  </div>
                </div>

                {overview?.monthlyTrend?.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {overview.monthlyTrend.map((m, idx) => {
                      const maxVal = Math.max(
                        ...overview.monthlyTrend.map((x) => Math.max(x.income, x.expense)),
                        1000
                      );
                      const inPct = Math.min(100, Math.round((m.income / maxVal) * 100));
                      const outPct = Math.min(100, Math.round((m.expense / maxVal) * 100));

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-white/80 font-bold">{m.month}</span>
                            <div className="flex gap-4">
                              <span className="text-emerald-400">₹{m.income.toLocaleString('en-IN')}</span>
                              <span className="text-rose-400">₹{m.expense.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="h-3 bg-white/5 rounded-full overflow-hidden flex gap-1 p-0.5">
                            <div
                              style={{ width: `${inPct}%` }}
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              title={`Inflow: ₹${m.income}`}
                            />
                            <div
                              style={{ width: `${outPct}%` }}
                              className="h-full bg-rose-500 rounded-full transition-all duration-500"
                              title={`Outflow: ₹${m.expense}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/40 text-sm">
                    No monthly transactions aggregated yet.
                  </div>
                )}
              </div>

              {/* Net Platform Liquidity Gauge & Financial Health */}
              <div className="bg-[#111622] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-purple-400" />
                    Platform Liquidity Health
                  </h3>
                  <p className="text-xs text-white/50 mb-6">
                    Real-time balance buffer across user accounts
                  </p>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
                    <span className="text-xs uppercase tracking-wider text-white/50 block font-mono">
                      Net Cumulative Surplus
                    </span>
                    <div
                      className={`text-2xl font-bold font-editorial mt-1 ${
                        (overview?.netPlatformSurplus || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ₹{overview ? (overview.netPlatformSurplus || 0).toLocaleString('en-IN') : '0'}
                    </div>
                    <p className="text-[11px] text-white/40 mt-1">
                      Gross Inflow minus Gross Outflow across all active accounts
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <span className="text-xs uppercase tracking-wider text-white/50 block font-mono">
                      Active EMI Debt Burdens
                    </span>
                    <div className="text-2xl font-bold font-editorial text-amber-400 mt-1">
                      ₹{overview ? (overview.totalEmiObligations || 0).toLocaleString('en-IN') : '0'}
                      <span className="text-xs font-normal text-white/40 ml-1">/ month</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1">
                      Total recurring monthly debt commitments currently tracked
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
                  <span>Last Sync:</span>
                  <span>{lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Syncing...'}</span>
                </div>
              </div>
            </div>

            {/* Quick Live Stream Row */}
            <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Latest Transactions Across Platform
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Live updates as users record items in their respective ledgers
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('live')}
                  className="text-xs text-[#088fff] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  View Full Live Feed <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-white/5">
                {overview?.recentActivity?.length > 0 ? (
                  overview.recentActivity.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{tx.title}</div>
                          <div className="text-xs text-white/40 flex items-center gap-2 font-mono">
                            <span>{tx.userName}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/70">
                              {tx.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold font-mono ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-white/40 font-mono">{tx.date}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-white/40 text-sm">
                    No recent transactions detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: SPENDING & CATEGORIES */}
        {/* ================================================================= */}
        {activeTab === 'spending' && (
          <div className="space-y-6">
            <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#088fff]" />
                    Global Spending by Category Breakdown
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Aggregate expense distribution across every active user account on Budget Buddy
                  </p>
                </div>
                <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">
                    Total Platform Expenses
                  </span>
                  <span className="text-2xl font-bold font-editorial text-rose-400">
                    ₹{spending ? (spending.grandTotalExpense || 0).toLocaleString('en-IN') : '0'}
                  </span>
                </div>
              </div>

              {/* Category Meter Rows */}
              <div className="mt-6 space-y-4">
                {spending?.categories?.length > 0 ? (
                  spending.categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${
                              CATEGORY_COLORS[cat.name] || 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {cat.name}
                          </span>
                          <span className="text-xs text-white/40 font-mono">
                            ({cat.transactionCount} transactions)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white font-mono">
                            ₹{cat.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-[#088fff] ml-2 font-mono font-bold">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${cat.percentage}%` }}
                          className="h-full bg-gradient-to-r from-[#088fff] to-purple-500 rounded-full transition-all duration-700"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-white/40 text-sm">
                    No expense category data recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CUSTOMER SEGMENTATION & USER MANAGEMENT */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
              {/* Header & Filter Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#088fff]" />
                    Customer Segmentation & Roster
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Classified by transacting volume, liquidity reserves, and engagement frequency
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search user or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#088fff]"
                    />
                  </div>

                  {/* Segment Filter */}
                  <select
                    value={segmentFilter}
                    onChange={(e) => setSegmentFilter(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg text-xs text-white/90 px-3 py-1.5 focus:outline-none focus:border-[#088fff] font-mono"
                  >
                    <option value="ALL">All Customer Segments</option>
                    <option value="VIP High-Roller">VIP High-Roller</option>
                    <option value="Super Saver">Super Saver</option>
                    <option value="Active Transactor">Active Transactor</option>
                    <option value="New Member">New Member</option>
                    <option value="Standard Member">Standard Member</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] text-white/50 uppercase font-mono border-b border-white/10">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Segment</th>
                      <th className="p-3">Inflow</th>
                      <th className="p-3">Outflow</th>
                      <th className="p-3">Net Balance</th>
                      <th className="p-3">Vault Savings</th>
                      <th className="p-3">Activity</th>
                      <th className="p-3">Member Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-white/40 font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${u.segmentBadge}`}>
                              {u.segment}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-semibold">
                            ₹{u.totalInflow.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-mono text-rose-400 font-semibold">
                            ₹{u.totalOutflow.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`p-3 font-mono font-bold ${
                              u.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            ₹{u.netBalance.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-mono text-amber-300">
                            ₹{u.vaultReserves.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-mono text-white/70">
                            {u.txCount} txs
                          </td>
                          <td className="p-3 font-mono text-white/50 text-[11px]">
                            {u.joinedDate}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-white/40">
                          No users match the criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: TOP CUSTOMERS LEADERBOARDS */}
        {/* ================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Leaderboard 1: Top Spenders */}
              <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Top Spenders</h4>
                    <span className="text-xs text-white/50 font-mono">Highest total outflows</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {topCustomers?.topSpenders?.length > 0 ? (
                    topCustomers.topSpenders.map((cust, idx) => (
                      <div
                        key={cust.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              idx === 0
                                ? 'bg-amber-400 text-black'
                                : idx === 1
                                ? 'bg-gray-300 text-black'
                                : 'bg-amber-800 text-white'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-white text-xs">{cust.name}</div>
                            <div className="text-[11px] text-white/40 font-mono">{cust.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-rose-400 font-mono text-sm">
                            ₹{cust.totalExpense.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">{cust.txCount} txs</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-white/40 text-xs">No customer data yet.</div>
                  )}
                </div>
              </div>

              {/* Leaderboard 2: Top Earners / Depositors */}
              <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Top Earners</h4>
                    <span className="text-xs text-white/50 font-mono">Highest recorded inflow</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {topCustomers?.topEarners?.length > 0 ? (
                    topCustomers.topEarners.map((cust, idx) => (
                      <div
                        key={cust.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              idx === 0
                                ? 'bg-amber-400 text-black'
                                : idx === 1
                                ? 'bg-gray-300 text-black'
                                : 'bg-amber-800 text-white'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-white text-xs">{cust.name}</div>
                            <div className="text-[11px] text-white/40 font-mono">{cust.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400 font-mono text-sm">
                            ₹{cust.totalIncome.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">{cust.txCount} txs</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-white/40 text-xs">No customer data yet.</div>
                  )}
                </div>
              </div>

              {/* Leaderboard 3: Top Savers / Vault Protectors */}
              <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Top Savers</h4>
                    <span className="text-xs text-white/50 font-mono">Largest vault reserves</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {topCustomers?.topSavers?.length > 0 ? (
                    topCustomers.topSavers.map((cust, idx) => (
                      <div
                        key={cust.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              idx === 0
                                ? 'bg-amber-400 text-black'
                                : idx === 1
                                ? 'bg-gray-300 text-black'
                                : 'bg-amber-800 text-white'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-white text-xs">{cust.name}</div>
                            <div className="text-[11px] text-white/40 font-mono">{cust.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-300 font-mono text-sm">
                            ₹{cust.vaultSavings.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">In Vault</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-white/40 text-xs">No vault data yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: REAL-TIME TRANSACTION FEED */}
        {/* ================================================================= */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Real-Time Platform Live Feed
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Instant stream of transactions directly pushed from user accounts in MongoDB Atlas
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Syncing every 6s
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60">{liveFeed.length} Stream items</span>
                </div>
              </div>

              {/* Feed Items */}
              <div className="divide-y divide-white/5 mt-4">
                {liveFeed.length > 0 ? (
                  liveFeed.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            item.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{item.title}</div>
                          <div className="text-xs text-white/50 flex flex-wrap items-center gap-2 font-mono mt-0.5">
                            <span className="text-white/80 font-medium">{item.user?.name || 'Customer'}</span>
                            <span className="text-white/30">({item.user?.email})</span>
                            <span className="text-white/30">•</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${
                                CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-base font-bold font-mono ${
                            item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-white/40 font-mono mt-0.5">{item.date}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-white/40 text-sm">
                    No transactions captured on the live feed yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: FEEDBACK & INQUIRIES RESPONSE SHEET */}
        {/* ================================================================= */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Sheet Overview Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-[#111622] border border-white/10 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-white/50 block">Total Entries</span>
                <span className="text-xl font-bold font-editorial text-white">
                  {feedbackData.stats.totalCount || 0}
                </span>
              </div>
              <div className="bg-[#111622] border border-rose-500/30 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Complaints
                </span>
                <span className="text-xl font-bold font-editorial text-rose-400">
                  {feedbackData.stats.complaintCount || 0}
                </span>
              </div>
              <div className="bg-[#111622] border border-amber-500/20 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-amber-400 block">Pending / New</span>
                <span className="text-xl font-bold font-editorial text-amber-400">
                  {feedbackData.stats.newCount || 0}
                </span>
              </div>
              <div className="bg-[#111622] border border-blue-500/20 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-blue-400 block">Under Review</span>
                <span className="text-xl font-bold font-editorial text-blue-400">
                  {feedbackData.stats.reviewedCount || 0}
                </span>
              </div>
              <div className="bg-[#111622] border border-emerald-500/20 rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase text-emerald-400 block">Resolved / Closed</span>
                <span className="text-xl font-bold font-editorial text-emerald-400">
                  {feedbackData.stats.resolvedCount || 0}
                </span>
              </div>
              <div className="bg-[#111622] border border-purple-500/20 rounded-xl p-3.5 col-span-2 md:col-span-1">
                <span className="text-[10px] font-mono uppercase text-purple-400 block">Public Reviews</span>
                <span className="text-xl font-bold font-editorial text-purple-400">
                  {feedbackData.stats.totalTestimonials || 0}
                </span>
              </div>
            </div>

            {/* Sub-navigation & Sheet Actions */}
            <div className="bg-[#111622] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-white/10 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">
                      Feedback, Inquiries & Grievance Spreadsheet
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Live repository of user submissions, complaints, and contact inquiries connected with Google Sheets Webhook
                  </p>
                </div>

                {/* Sub Tab buttons & Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setFeedbackSubTab('sheet')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                        feedbackSubTab === 'sheet' ? 'bg-[#088fff] text-white font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Response Rows
                    </button>
                    <button
                      onClick={() => setFeedbackSubTab('testimonials')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                        feedbackSubTab === 'testimonials' ? 'bg-[#088fff] text-white font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Praise Reviews ({feedbackData.testimonials?.length || 0})
                    </button>
                    <button
                      onClick={() => setFeedbackSubTab('webhook')}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                        feedbackSubTab === 'webhook' ? 'bg-[#088fff] text-white font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Google Webhook
                    </button>
                  </div>

                  {/* Purge sample test data button */}
                  <button
                    onClick={handlePurgeSamples}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-mono font-medium transition-all cursor-pointer"
                    title="Purge pre-seeded sample data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge Test Data
                  </button>

                  {/* Export CSV button */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* VIEW A: MAIN RESPONSE SPREADSHEET */}
              {feedbackSubTab === 'sheet' && (
                <div className="mt-4 space-y-4">
                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search by ticket #, name, email, subject, or message..."
                        value={feedbackSearch}
                        onChange={(e) => setFeedbackSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#088fff]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-white/40" />

                      {/* Type Filter */}
                      <select
                        value={feedbackTypeFilter}
                        onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg text-xs text-white/90 px-3 py-1.5 focus:outline-none focus:border-[#088fff] font-mono"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="complaint">🚨 Complaints Only</option>
                        <option value="inquiry">💬 Inquiries Only</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={feedbackStatusFilter}
                        onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg text-xs text-white/90 px-3 py-1.5 focus:outline-none focus:border-[#088fff] font-mono"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="New">Pending (New)</option>
                        <option value="Reviewed">Under Review</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>

                  {/* High-Density Spreadsheet Table */}
                  <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.04] text-white/60 uppercase font-mono border-b border-white/10 select-none">
                        <tr>
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3 w-32">Ticket / Type</th>
                          <th className="p-3 w-36">Timestamp</th>
                          <th className="p-3 w-56">Contact Identity</th>
                          <th className="p-3 w-60">Category / Subject</th>
                          <th className="p-3 min-w-[320px]">Feedback / Complaint Body</th>
                          <th className="p-3 w-24 text-center">Rating</th>
                          <th className="p-3 w-40">Status Resolution</th>
                          <th className="p-3 w-20 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredFeedbackRows.length > 0 ? (
                          filteredFeedbackRows.map((row, idx) => {
                            const isComplaintRow =
                              row.type === 'complaint' ||
                              row.ticketId?.startsWith('CMP') ||
                              row.subject?.toLowerCase().includes('complaint');

                            return (
                              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                                {/* Row index */}
                                <td className="p-3 text-center font-mono text-white/40">
                                  {idx + 1}
                                </td>

                                {/* Ticket / Type Badge */}
                                <td className="p-3 font-mono">
                                  {isComplaintRow ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                                        {row.ticketId || 'CMP'}
                                      </span>
                                      {row.severity && (
                                        <span className={`block text-[9px] uppercase tracking-wider font-semibold ${
                                          row.severity === 'Critical' ? 'text-rose-400 font-bold animate-pulse' :
                                          row.severity === 'High' ? 'text-orange-400' :
                                          row.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>
                                          {row.severity} Priority
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                      <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                                      {row.ticketId || 'INQ'}
                                    </span>
                                  )}
                                </td>

                                {/* Timestamp */}
                                <td className="p-3 font-mono text-white/60 text-[11px] whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-white/30" />
                                    <span>{row.timestamp}</span>
                                  </div>
                                  <span className="text-[10px] text-white/30 block mt-0.5">{row.source}</span>
                                </td>

                                {/* Identity */}
                                <td className="p-3">
                                  <div className="font-semibold text-white">{row.name}</div>
                                  <div className="text-white/40 font-mono text-[11px] truncate max-w-[240px]" title={row.email}>
                                    {row.email}
                                  </div>
                                  {row.phone && row.phone !== 'N/A' && (
                                    <div className="text-[10px] text-white/30 font-mono">{row.phone}</div>
                                  )}
                                </td>

                                {/* Subject */}
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] text-white/90 inline-block max-w-[260px] truncate" title={row.subject}>
                                    {row.subject}
                                  </span>
                                </td>

                                {/* Feedback Body */}
                                <td className="p-3 text-white/80 leading-relaxed min-w-[280px]">
                                  <p className="line-clamp-3 text-[11.5px] whitespace-pre-wrap">{row.message}</p>
                                </td>

                                {/* Rating Stars */}
                                <td className="p-3 text-center">
                                  <div className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>{row.rating || 5}/5</span>
                                  </div>
                                </td>

                                {/* Status Dropdown */}
                                <td className="p-3">
                                  <select
                                    value={row.status === 'Under Review' ? 'Reviewed' : (row.status === 'Pending' ? 'New' : row.status)}
                                    disabled={updatingFeedbackId === row.id}
                                    onChange={(e) => handleFeedbackStatusUpdate(row.id, e.target.value)}
                                    className={`text-[11px] font-mono px-2 py-1 rounded border font-semibold cursor-pointer focus:outline-none ${
                                      row.status === 'New' || row.status === 'Pending'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        : row.status === 'Reviewed' || row.status === 'Under Review'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    }`}
                                  >
                                    <option value="New" className="bg-[#111622] text-amber-400">🟡 Pending (New)</option>
                                    <option value="Reviewed" className="bg-[#111622] text-blue-400">🔵 Under Review</option>
                                    <option value="Resolved" className="bg-[#111622] text-emerald-400">🟢 Resolved</option>
                                  </select>
                                </td>

                                {/* Actions */}
                                <td className="p-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Mailto Reply button quoting ticket */}
                                    <a
                                      href={`mailto:${row.email}?subject=${encodeURIComponent(`[Ticket #${row.ticketId || 'BD-SUPPORT'}] Budget Buddy Support: ${row.subject}`)}`}
                                      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                      title={`Reply to ${row.email}`}
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>

                                    {/* Delete row */}
                                    <button
                                      onClick={() => handleFeedbackDelete(row.id)}
                                      className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                      title="Delete feedback entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="9" className="p-10 text-center text-white/40 font-mono">
                              No entries found matching your filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW B: VERIFIED PRAISE & TESTIMONIALS */}
              {feedbackSubTab === 'testimonials' && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedbackData.testimonials?.length > 0 ? (
                      feedbackData.testimonials.map((t) => (
                        <div
                          key={t.id}
                          className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 text-amber-400">
                                {[...Array(t.rating || 5)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                              <span className="text-[10px] text-white/40 font-mono">{t.date}</span>
                            </div>
                            <p className="text-xs text-white/90 italic leading-relaxed">
                              "{t.quote}"
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-white block">{t.author}</span>
                              <span className="text-white/40 text-[11px] font-mono">{t.role} • {t.company}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                              Verified Public Praise
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-10 text-center text-white/40 font-mono">
                        No public user reviews recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW C: CONNECTED GOOGLE SHEET WEBHOOK DETAILS */}
              {feedbackSubTab === 'webhook' && (
                <div className="mt-4 space-y-4">
                  <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Google Apps Script Webhook Integration
                      </h4>
                      <p className="text-xs text-white/50 mt-1">
                        When users submit inquiries on the contact form, responses are simultaneously dispatched to this Google Apps Script endpoint and recorded in MongoDB Atlas.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
                      <div className="truncate text-white/80 select-all" title={GOOGLE_SHEET_WEBHOOK_URL}>
                        {GOOGLE_SHEET_WEBHOOK_URL}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(GOOGLE_SHEET_WEBHOOK_URL);
                          setCopiedWebhook(true);
                          setTimeout(() => setCopiedWebhook(false), 2000);
                        }}
                        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2">
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/40 block text-[10px]">TRANSMISSION PROTOCOL</span>
                        <span className="text-white font-bold mt-0.5 block">POST Webhook (no-cors)</span>
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/40 block text-[10px]">COLUMNS SYNCED</span>
                        <span className="text-white font-bold mt-0.5 block">Timestamp, Name, Email, Phone, Subject, Message</span>
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-white/40 block text-[10px]">INTEGRATION HEALTH</span>
                        <span className="text-emerald-400 font-bold mt-0.5 block flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active & Operational
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/40 font-mono mt-auto">
        BUDGET BUDDY PLATFORM GOVERNANCE & TELEMETRY ENGINE • REVISION 2026.1
      </footer>
    </div>
  );
};

export default AdminPage;
