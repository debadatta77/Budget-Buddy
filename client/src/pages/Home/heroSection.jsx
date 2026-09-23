import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { GeminiAdvisorChat } from '../../components/ai/GeminiAdvisorChat';
import { EmiBentoSection } from './EmiBentoSection';
import { AboutUs } from '../about/AboutUs';
import { BudgetSavingsSection } from '../savings/BudgetSavingsSection';
import { DashboardSection } from '../dashboard/DashboardSection';
import { ProfileSection } from '../profile/ProfileSection';
import { Testimonials } from '../testimonials/Testimonials';
import { Footer } from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';

export const Hero = ({ onGetStarted, onOpenCardStudio, customCard }) => {
    const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
    const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
    const [getStartedMode, setGetStartedMode] = useState('signup');
    const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
    const [activeCustomCard, setActiveCustomCard] = useState(customCard || {
        holderName: 'Ralph Edwards',
        cardNumber: '•••• •••• •••• 4821',
        expiryDate: '12/28',
        cvv: '894',
        theme: 'black'
    });
    const aiChatRef = useRef(null);

    const handleOpenGetStarted = (mode = 'signup') => {
        setGetStartedMode(typeof mode === 'string' ? mode : 'signup');
        if (onGetStarted) onGetStarted(mode);
        setIsGetStartedOpen(true);
    };

    const handleOpenCardStudio = () => {
        if (onOpenCardStudio) onOpenCardStudio();
        setIsCardStudioOpen(true);
    };

    const handleTriggerAIChat = () => {
        const element = document.getElementById('gemini-ai-chat-container');
        if (element) {
            const yOffset = -90;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setTimeout(() => {
            aiChatRef.current?.focusInput();
        }, 250);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    return (
        <div className="w-full min-h-screen bg-[#F9F8F5]">
            <Navbar onOpenSignUp={handleOpenGetStarted} onOpenCardStudio={handleOpenCardStudio} onTriggerAIChat={handleTriggerAIChat} />
            <section
                id="products"
                className="relative bg-[#F9F8F5] text-[#1A1A1A] pt-24 pb-16 lg:pt-32 lg:pb-40 border-b border-[#1A1A1A]/15 overflow-hidden"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Editorial Eyebrow */}
                    <div className="flex items-center justify-between pb-6 border-b border-[#1A1A1A]/10 mb-10">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A1A1A]/60 font-mono">
                                {formattedTime} / {formattedMonthYear}
                            </span>
                            <span className="text-[#1A1A1A]/20">•</span>
                            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088FFF]">
                                EXPENSE TRACKER & MANAGEMENT SYSTEM
                            </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/60">
                                LEDGER STATUS: <span className='text-[#088FFF]/80'>ACTIVE </span>
                            </span>
                        </div>
                    </div>

                    {/* Big Editorial Headline */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                        <div className="lg:col-span-8">
                            <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-medium tracking-tighter leading-[0.92] text-[#1A1A1A] font-editorial select-none">
                                SECURE YOUR <br />
                                <span className="italic sm:ml-16 text-[#088fff] inline-block font-normal">
                                    FINANCIAL
                                </span>{' '}
                                FUTURE
                            </h1>

                            <p className="mt-8 text-lg sm:text-xl text-[#1A1A1A]/80 font-light leading-relaxed max-w-xl font-sans-clean">
                                Track every expense, understand every Rupee, and stay in control of your finances — all in one clean, simple dashboard. No spreadsheets, no stress, just clarity.
                            </p>

                            {/* Editorial CTA Buttons */}
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <button
                                    onClick={handleOpenGetStarted}
                                    id="hero-get-started-cta"
                                    className="bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-8 rounded-sm shadow-md transition-colors duration-200 flex items-center gap-3 group cursor-pointer"
                                >
                                    <span>GET STARTED</span>
                                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={handleTriggerAIChat}
                                    className="border border-[#1A1A1A]/30 hover:border-[#1A1A1A] hover:bg-white text-[#1A1A1A] text-[11px] uppercase tracking-[0.2em] font-bold py-4 px-6 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                    <span>AI / Suggestion</span>
                                </button>
                            </div>
                        </div>

                        {/* Right AI Chat Bot Box */}
                        <div id="gemini-ai-chat-container" className="lg:col-span-4 border-l border-[#1A1A1A]/10 pl-0 lg:pl-6 pt-4 lg:pt-0">
                            <GeminiAdvisorChat ref={aiChatRef} isFloating={false} />
                        </div>
                    </div>

                    {/* Extracted Standalone EMI Bento Section */}
                    <EmiBentoSection customCard={activeCustomCard} onTriggerAIChat={handleTriggerAIChat} />
                </div>
            </section>
            <DashboardSection />
            <BudgetSavingsSection />
            <ProfileSection />
            <AboutUs />
            <Testimonials />
            <Footer onGetStarted={handleOpenGetStarted} />
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
        </div>
    );
};

export const HeroSection = Hero;
export default Hero;
