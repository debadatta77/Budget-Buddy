import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu, X, Sparkles, User, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const getInitialActiveSection = (pathname) => {
    if (pathname === '/expenses') return 'expenses';
    if (pathname === '/savings' || pathname === '/budget') return 'savings';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/about') return 'about';
    return 'dashboard';
};

export const Navbar = ({ onOpenSignUp, onOpenCardStudio, onTriggerAIChat }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useContext(AuthContext);

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(() => getInitialActiveSection(location.pathname));

    const navLinks = [
        { name: 'Dashboard', id: 'dashboard', href: '#dashboard' },
        { name: 'Add / View Expenses', id: 'expenses', href: '#expenses' },
        { name: 'Budget & Savings', id: 'savings', href: '#savings' },
        { name: 'Profile', id: 'profile', href: '#profile' },
        { name: 'About Us', id: 'about', href: '#about' },
    ];

    // Scroll listener for Navbar background & dynamic section spy
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);

            if (location.pathname === '/' || location.pathname === '/dashboard') {
                const sectionIds = ['dashboard', 'expenses', 'savings', 'profile', 'about'];
                const scrollPosition = window.scrollY + 220;

                for (let i = sectionIds.length - 1; i >= 0; i--) {
                    const sectionEl = document.getElementById(sectionIds[i]);
                    if (sectionEl) {
                        const top = sectionEl.offsetTop;
                        if (scrollPosition >= top) {
                            setActiveSection(sectionIds[i]);
                            break;
                        }
                    }
                }
            } else {
                setActiveSection(getInitialActiveSection(location.pathname));
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const scrollToTarget = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -90;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Auto-scroll on hash load
    useEffect(() => {
        if (window.location.hash && (location.pathname === '/' || location.pathname === '/dashboard')) {
            const id = window.location.hash.replace('#', '');
            if (id) {
                const timer = setTimeout(() => {
                    scrollToTarget(id);
                    setActiveSection(id);
                }, 250);
                return () => clearTimeout(timer);
            }
        }
    }, [location.pathname, location.hash]);

    const handleNavClick = (e, link) => {
        e.preventDefault();
        setActiveSection(link.id);

        if (location.pathname === '/' || location.pathname === '/dashboard') {
            scrollToTarget(link.id);
            window.history.pushState(null, '', `#${link.id}`);
        } else {
            navigate(`/#${link.id}`);
            setTimeout(() => {
                scrollToTarget(link.id);
            }, 250);
        }
    };

    const handleAIClick = () => {
        if (onTriggerAIChat) {
            onTriggerAIChat();
        } else if (location.pathname === '/' || location.pathname === '/dashboard') {
            const element = document.getElementById('gemini-ai-chat-container');
            if (element) {
                const yOffset = -90;
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            } else {
                navigate('/ai-advisor');
            }
        } else {
            navigate('/ai-advisor');
        }
    };

    return (
        <header
            id="main-navbar"
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-[#F9F8F5]/95 backdrop-blur-md border-b border-[#1A1A1A]/15 py-4 shadow-sm'
                : 'bg-[#F9F8F5] border-b border-[#1A1A1A]/10 py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Brand Logo - Editorial Serif */}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (location.pathname === '/' || location.pathname === '/dashboard') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setActiveSection('dashboard');
                            } else {
                                navigate('/');
                            }
                        }}
                        id="navbar-brand-logo"
                        className="flex items-center gap-3 group focus:outline-none cursor-pointer"
                    >
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-800 to-black rounded-full flex items-center justify-center text-[#F9F8F5]">
                            <div className="w-2 h-2 rounded-full bg-[#ffffff]"></div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold tracking-tight font-editorial text-[#1A1A1A]">
                                Budget
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.25em] font-sans-clean text-[#1A1A1A]/50">
                                - Buddy
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8" id="desktop-nav-menu">
                        {navLinks.map((link) => {
                            const isActive = activeSection === link.id;
                            return (
                                <a
                                    key={link.id}
                                    href={link.href}
                                    onClick={(e) => handleNavClick(e, link)}
                                    className={`text-[10px] uppercase tracking-[0.25em] transition-all duration-200 py-1 border-b-2 font-bold cursor-pointer ${isActive
                                        ? 'text-[#088fff] border-[#088fff]'
                                        : 'text-[#1A1A1A]/60 border-transparent hover:text-[#1a1a1a] hover:border-[#1A1A1A]/30'
                                        }`}
                                >
                                    {link.name}
                                </a>
                            );
                        })}
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleAIClick}
                            id="navbar-customize-card-btn"
                            className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/70 hover:text-[#1a1a1a] px-3.5 py-1.5 border border-[#1A1A1A]/20 hover:border-[#1a1a1a] rounded-sm transition-all duration-200 flex items-center gap-2 cursor-pointer"
                        >
                            <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
                            <span>AI / Suggestion</span>
                        </button>

                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleNavClick(e, { id: 'profile' })}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/15 rounded-sm font-mono text-xs font-bold text-[#1A1A1A] cursor-pointer"
                                >
                                    <User className="w-3.5 h-3.5 text-[#088fff]" />
                                    <span>{user.name || 'Member Profile'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-mono text-xs font-bold rounded-sm transition-colors cursor-pointer"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenSignUp}
                                id="navbar-signup-button"
                                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-bold text-[#F9F8F5] bg-[#1A1A1A] hover:bg-[#088fff] px-5 py-2 rounded-sm transition-all duration-200 group shadow-sm cursor-pointer"
                            >
                                <span>Sign In / Up</span>
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        {isAuthenticated && user ? (
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/');
                                }}
                                className="text-[10px] uppercase tracking-widest font-bold text-white bg-rose-600 px-3 py-1.5 rounded-sm flex items-center gap-1"
                            >
                                <LogOut className="w-3 h-3" />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={onOpenSignUp}
                                className="text-[10px] uppercase tracking-widest font-bold text-[#F9F8F5] bg-[#1A1A1A] px-3 py-1.5 rounded-sm"
                            >
                                Sign In / Up
                            </button>
                        )}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            id="navbar-mobile-toggle"
                            className="p-2 text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-sm"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[#F9F8F5] border-b border-[#1A1A1A] px-4 pt-3 pb-6 space-y-3">
                    {navLinks.map((link) => {
                        const isActive = activeSection === link.id;
                        return (
                            <a
                                key={link.id}
                                href={link.href}
                                onClick={(e) => {
                                    setMobileMenuOpen(false);
                                    handleNavClick(e, link);
                                }}
                                className={`block px-3 py-2 text-xs uppercase tracking-[0.2em] font-bold border-l-2 transition-colors ${isActive
                                    ? 'text-[#088fff] border-[#088fff] bg-[#088fff]/5'
                                    : 'text-[#1A1A1A]/80 border-transparent hover:text-[#1A1A1A]'
                                    }`}
                            >
                                {link.name}
                            </a>
                        );
                    })}
                    <div className="pt-3 flex flex-col gap-2">
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                handleAIClick();
                            }}
                            className="w-full py-2.5 px-4 border border-[#1A1A1A]/20 text-[11px] uppercase tracking-widest font-bold text-[#1A1A1A] flex items-center justify-center gap-2 rounded-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-[#088fff]" />
                            <span>AI / Suggestion</span>
                        </button>
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
