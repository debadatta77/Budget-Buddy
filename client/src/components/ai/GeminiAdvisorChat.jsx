import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Sparkles, Send, User } from 'lucide-react';

export const GeminiAdvisorChat = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: "Hello! I'm your Gemini AI Financial Advisor. Ask me anything about budget planning, expense tracking, or smart saving strategies!"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const quickPrompts = [
        " How do I start budgeting?",
        " What is 50/30/20 rule?",
        " Build emergency savings",
        " Reduce daily expenses"
    ];

    const generateAIResponse = async (userText) => {
        setIsLoading(true);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (apiKey) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are an expert AI Financial Advisor for Budget-Buddy / FinGuard. Provide concise, encouraging, actionable financial advice in 2-4 sentences for: ${userText}`
                            }]
                        }]
                    })
                });
                const data = await res.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply) {
                    setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply }]);
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                console.warn("Gemini API call error, using smart fallback:", err);
            }
        }

        // Smart domain-specific AI financial advice generator fallback
        setTimeout(() => {
            let reply = "";
            const lower = userText.toLowerCase();

            if (lower.includes('rule') || lower.includes('50/30/20') || lower.includes('method')) {
                reply = "The 50/30/20 rule allocates 50% of income to Needs (rent, utilities), 30% to Wants (dining, hobbies), and 20% to Savings & Debt repayment. It's a proven foundation for sustainable financial balance!";
            } else if (lower.includes('emergency') || lower.includes('save') || lower.includes('savings')) {
                reply = "Aim to save 3 to 6 months of essential living expenses in a high-yield liquid account. Start small by automating 10% of each paycheck into your emergency fund.";
            } else if (lower.includes('reduce') || lower.includes('cut') || lower.includes('expense') || lower.includes('daily')) {
                reply = "Audit your last 30 days of recurring subscriptions and non-essential dining. Cooking at home and canceling unused apps can free up $200–$500 per month instantly.";
            } else if (lower.includes('budget') || lower.includes('start') || lower.includes('begin')) {
                reply = "Start by tracking every income source and fixed expense in Budget-Buddy. Setting daily category limits will give you total visibility and prevent impulse overspending.";
            } else {
                reply = `Great question on "${userText}". Focusing on consistent monthly tracking, automated savings, and reviewing spending categories weekly will significantly accelerate your financial goals!`;
            }

            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply }]);
            setIsLoading(false);
        }, 800);
    };

    const handleSend = (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: Date.now(), sender: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        const text = input.trim();
        setInput('');

        generateAIResponse(text);
    };

    const handlePromptClick = (prompt) => {
        if (isLoading) return;
        const cleanPrompt = prompt.replace(/^[\u2000-\u3300\ud83c-\udfff\ud83d-\udfff\ud83e-\udfff]\s*/, '');
        const userMessage = { id: Date.now(), sender: 'user', text: cleanPrompt };
        setMessages(prev => [...prev, userMessage]);
        generateAIResponse(cleanPrompt);
    };

    return (
        <div className="bg-[#1A1A1A] text-[#F9F8F5] p-5 rounded-sm flex flex-col justify-between shadow-xl h-[380px] border border-[#1A1A1A] relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#007FFF] via-[#C44D32] to-[#007FFF]"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#007FFF]/20 border border-[#007FFF]/40 flex items-center justify-center text-[#007FFF]">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold font-editorial uppercase tracking-wider text-white">
                            Budget Buddy / AI Advisor
                        </h3>
                        <span className="text-[9px] text-white/50 font-mono block">
                            FINANCIAL INTELLIGENCE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold">ONLINE</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 space-y-3 text-xs">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.sender === 'ai' && (
                            <div className="w-5 h-5 rounded-full bg-[#007FFF]/30 flex items-center justify-center text-[#007FFF] shrink-0 mt-0.5">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                            </div>
                        )}

                        <div
                            className={`max-w-[82%] px-3 py-2 rounded-sm text-[11px] leading-relaxed font-sans-clean ${msg.sender === 'user'
                                ? 'bg-[#007FFF] text-white font-medium self-end'
                                : 'bg-white/10 text-white/90 border border-white/10'
                                }`}
                        >
                            {msg.text}
                        </div>

                        {msg.sender === 'user' && (
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                                <User className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-2 text-white/60">
                        <div className="w-5 h-5 rounded-full bg-[#007FFF]/30 flex items-center justify-center text-[#007FFF] shrink-0">
                            <Sparkles className="w-3 h-3 text-[#007FFF] animate-spin" />
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#007FFF] rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-[#007FFF] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-[#007FFF] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="py-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-t border-white/5 pt-2 mb-1">

                {quickPrompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handlePromptClick(prompt)}
                        className="text-[9px] whitespace-nowrap bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 px-2 py-1 rounded-sm transition-colors shrink-0"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="flex items-center gap-2 pt-1 border-t border-white/10">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Gemini for advice..."
                    className="flex-1 bg-white/5 border border-white/15 rounded-sm px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#007FFF] transition-colors"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-[#007FFF] hover:bg-[#0066CC] disabled:opacity-40 text-white p-1.5 rounded-sm transition-colors shrink-0 hover:cursor-pointer"
                    aria-label="Send message"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>
        </div>
    );
});

export default GeminiAdvisorChat;
