import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X, Sparkles, User, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export const Navbar = ({ onOpenSignUp }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useContext(AuthContext);

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const publicNavLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
    ];

    const authenticatedNavLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Expenses', path: '/expenses' },
        { name: 'Budget & Savings', path: '/budget' },
        { name: 'EMI Studio', path: '/emi-studio' },
        { name: 'Analytics', path: '/analytics' },
        { name: 'Reports', path: '/reports' },
        { name: 'Profile', path: '/profile' },
    ];

    const navLinks = isAuthenticated ? authenticatedNavLinks : publicNavLinks;

    // Scroll listener for Navbar background styling
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isLinkActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/dashboard') return location.pathname === '/dashboard';
        if (path === '/budget') return location.pathname === '/budget' || location.pathname === '/savings';
        if (path === '/emi-studio') return location.pathname === '/emi-studio' || location.pathname === '/cards';
        return location.pathname.startsWith(path);
    };

    const handleAIClick = () => {
        navigate('/ai-advisor');
    };

    return (
        <header
            id="main-navbar"
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-[#F9F8F5]/95 backdrop-blur-md border-b border-[#1A1A1A]/15 py-3.5 shadow-xs'
                : 'bg-[#F9F8F5] border-b border-[#1A1A1A]/10 py-4'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-3">
                    {/* Brand Logo - Aligned & Non-wrapping */}
                    <Link
                        to="/"
                        id="navbar-brand-logo"
                        className="flex items-center gap-2.5 group focus:outline-none cursor-pointer shrink-0"
                    >
                        <div className="w-7 h-7 bg-gradient-to-br from-[#088fff] to-[#1A1A1A] rounded-full flex items-center justify-center text-white shadow-xs shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-xl font-bold tracking-tight font-editorial text-[#1A1A1A] leading-none">
                                Budget
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-[#088fff] bg-[#088fff]/10 px-1.5 py-0.5 rounded leading-none">
                                Buddy
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 whitespace-nowrap" id="desktop-nav-menu">
                        {navLinks.map((link) => {
                            const active = isLinkActive(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`text-[11px] uppercase tracking-[0.14em] transition-all duration-200 py-1.5 border-b-2 font-bold cursor-pointer whitespace-nowrap ${active
                                        ? 'text-[#088fff] border-[#088fff]'
                                        : 'text-[#1A1A1A]/70 border-transparent hover:text-[#1a1a1a] hover:border-[#1A1A1A]/30'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Action Buttons - Uniform Height & Alignment */}
                    <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0 whitespace-nowrap">
                        {isAuthenticated && (
                            <button
                                onClick={handleAIClick}
                                id="navbar-ai-advisor-btn"
                                className={`h-9 px-3.5 text-[11px] uppercase tracking-[0.15em] font-bold border rounded-sm transition-all duration-200 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                                    location.pathname === '/ai-advisor'
                                        ? 'bg-[#088fff] text-white border-[#088fff] shadow-xs'
                                        : 'text-[#1A1A1A] hover:bg-white border-[#1A1A1A]/20 hover:border-[#1A1A1A]/50 bg-white/70 shadow-xs'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                                <span>AI Advisor</span>
                            </button>
                        )}

                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                                <Link
                                    to="/profile"
                                    className="h-9 px-3 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/15 rounded-sm font-sans-clean text-xs font-semibold text-[#1A1A1A] inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 max-w-[150px] xl:max-w-[200px]"
                                    title={user.name || 'Member Profile'}
                                >
                                    <User className="w-3.5 h-3.5 text-[#088fff] shrink-0" />
                                    <span className="truncate">{user.name || 'Member Profile'}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="h-9 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-sans-clean text-xs font-semibold rounded-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenSignUp}
                                id="navbar-signup-button"
                                className="h-9 px-4 text-[11px] uppercase tracking-[0.16em] font-bold text-[#F9F8F5] bg-[#1A1A1A] hover:bg-[#088fff] rounded-sm transition-all duration-200 inline-flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                            >
                                <span>Sign In / Up</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex lg:hidden items-center gap-2">
                        {isAuthenticated && user ? (
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/');
                                }}
                                className="h-8 px-2.5 text-[10px] uppercase tracking-wider font-bold text-white bg-rose-600 rounded-sm flex items-center gap-1"
                            >
                                <LogOut className="w-3 h-3" />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={onOpenSignUp}
                                className="h-8 px-2.5 text-[10px] uppercase tracking-wider font-bold text-[#F9F8F5] bg-[#1A1A1A] rounded-sm"
                            >
                                Sign In / Up
                            </button>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            id="navbar-mobile-toggle"
                            className="p-1.5 text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-sm"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile / Tablet Dropdown */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-[#F9F8F5] border-b border-[#1A1A1A] px-4 pt-3 pb-6 space-y-3">
                    {navLinks.map((link) => {
                        const active = isLinkActive(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-3 py-2 text-xs uppercase tracking-[0.2em] font-bold border-l-2 transition-colors ${active
                                    ? 'text-[#088fff] border-[#088fff] bg-[#088fff]/5'
                                    : 'text-[#1A1A1A]/80 border-transparent hover:text-[#1A1A1A]'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                    <div className="pt-3 flex flex-col gap-2">
                        {isAuthenticated && (
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    handleAIClick();
                                }}
                                className="w-full py-2.5 px-4 border border-[#1A1A1A]/20 text-[11px] uppercase tracking-widest font-bold text-[#1A1A1A] flex items-center justify-center gap-2 rounded-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#088fff]" />
                                <span>AI Advisor</span>
                            </button>
                        )}
                        {isAuthenticated ? (
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    logout();
                                    navigate('/');
                                }}
                                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-sm cursor-pointer"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign Out ({user?.name || 'Account'})</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    onOpenSignUp();
                                }}
                                className="w-full py-2.5 px-4 bg-[#1A1A1A] text-[#F9F8F5] text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-sm"
                            >
                                <span>Sign In / Sign Up</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
