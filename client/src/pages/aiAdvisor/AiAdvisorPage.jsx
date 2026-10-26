import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Trash2, 
  RotateCcw, 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  PieChart, 
  ArrowRight,
  Info,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Layers,
  PiggyBank
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { calculateFinancialTelemetry } from '../../services/userDataService';
import { aiAdvisorAPI } from '../../services/apiClient';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { useCurrency } from '../../utils/formatCurrency';

const CHAT_STORAGE_KEY = 'budget_buddy_ai_chat_history';

export const AiAdvisorPage = () => {
  const { symbol, formatCurrency: fmtCurr } = useCurrency();
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [isConfirmResetChatOpen, setIsConfirmResetChatOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const strategyMode = 'balanced';

  // Dynamic User Telemetry
  const [telemetry, setTelemetry] = useState(() => calculateFinancialTelemetry());

  useEffect(() => {
    const handleSync = () => {
      setTelemetry(calculateFinancialTelemetry());
    };
    window.addEventListener('userDataChanged', handleSync);
    return () => window.removeEventListener('userDataChanged', handleSync);
  }, []);

  const { summary, categories, rule503020 } = telemetry;
  const currentIncome = Number(summary.totalIncome) || 0;
  const currentExpense = Number(summary.totalExpense) || 0;
  const netSavings = summary.netSavings !== undefined ? summary.netSavings : (currentIncome - currentExpense);

  const initialMessage = useMemo(() => ({
    id: 1,
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: `Hello ${telemetry.user?.name || 'there'}! I'm your Budget Buddy Financial Assistant. I can see your monthly income (${fmtCurr(currentIncome)}), your total spending this month (${fmtCurr(currentExpense)}), and your emergency savings fund (${fmtCurr(summary.totalVaultSavings || 0)}). What would you like to know or improve today?`
  }), [currentIncome, currentExpense, summary.totalVaultSavings, telemetry.user?.name, fmtCurr]);

  // Persistent messages from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [initialMessage];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Error saving chat history:', e);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const promptStarters = [
    { title: "Analyze My Spending", prompt: "Can you look at my monthly spending and tell me how I can save more?" },
    { title: "50/30/20 Budget Check", prompt: "How is my 50/30/20 budget looking right now? Am I on track?" },
    { title: "Emergency Fund Plan", prompt: "How many months of expenses does my emergency savings cover, and how can I grow it?" },
    { title: "Managing Loans & EMIs", prompt: "What is the smartest way to manage my monthly loan EMIs and bills?" },
    { title: "Cut Top Expenses", prompt: `My biggest expense right now is ${categories[0]?.name || 'General'}. What are 3 easy ways I can cut down on it?` }
  ];

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateAIResponse = async (userText) => {
    setIsLoading(true);

    // 1. Try Backend AI Advisor with Live Portfolio Telemetry Injection
    try {
      const res = await aiAdvisorAPI.chat(userText, 'balanced', symbol, telemetry);
      if (res?.data?.reply) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: res.data.reply
        }]);
        setIsLoading(false);
        return;
      }
    } catch (apiErr) {
      console.warn("Backend AI Advisor query failed, checking direct client or local fallback:", apiErr);
    }

    // 2. Client Gemini Fallback if direct browser key is present
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Financial context payload for Gemini
    const financialContext = `
User Financial Summary:
- Preferred Currency: ${symbol}
- Monthly Income: ${fmtCurr(currentIncome)}
- Monthly Expenses (Spending): ${fmtCurr(currentExpense)}
- Money Left Over (Monthly Savings): ${fmtCurr(netSavings)} (Savings Rate: ${summary.savingsRate}%)
- Emergency Fund (Vault Savings): ${fmtCurr(summary.totalVaultSavings || 0)}
- 50/30/20 Budget Breakdown: Needs ${rule503020.needs.actual}% (Target 50%), Wants ${rule503020.wants.actual}% (Target 30%), Savings ${rule503020.savings.actual}% (Target 20%)
- Top Spending Categories: ${categories.slice(0, 3).map(c => `${c.name}: ${fmtCurr(c.amount)} (${c.percent}%)`).join(', ')}
`;

    if (apiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a friendly, encouraging personal financial advisor for Budget Buddy. 
Answer the user's question using their real financial numbers provided below.

COMMUNICATION RULES (VERY IMPORTANT):
- Speak in simple, friendly, easy-to-understand plain English.
- Avoid robotic or heavy financial jargon (do NOT use words like "burn rate", "liquidity", "telemetry", "runway", "discretionary variance").
- Use everyday words like "monthly spending", "money left over", "emergency fund", "savings cushion", and "needs vs wants".
- Keep your answer practical, encouraging, and clear (2 to 3 short paragraphs or easy bullet points).
- Conclude with 1 simple, practical step they can take today.

${financialContext}

User Question: ${userText}`
              }]
            }]
          })
        });

        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: reply
          }]);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Direct client Gemini call failed, using heuristic fallback:", err);
      }
    }

    // Context-Aware Dynamic Fallback Generator (using simple, friendly English)
    setTimeout(() => {
      let reply = "";
      const lower = userText.toLowerCase();

      if (lower.includes('analyze') || lower.includes('spending') || lower.includes('burn')) {
        reply = `Looking at your finances, you spend about ${fmtCurr(currentExpense)} each month from your ${fmtCurr(currentIncome)} income. This leaves you with a great savings cushion of ${fmtCurr(netSavings)} every month (saving ${summary.savingsRate}% of what you earn).

Your highest expense is ${categories[0]?.name || 'Essentials'} at ${fmtCurr(categories[0]?.amount || 0)}. Keeping a close eye on this category is the easiest way to keep more money in your pocket!`;
      } else if (lower.includes('50/30/20') || lower.includes('rule') || lower.includes('budget')) {
        reply = `Here is a simple look at your budget using the popular 50/30/20 guideline:

• Needs (Rent, Bills, Groceries): ${rule503020.needs.actual}% of spending (Goal: around 50%) — ${rule503020.needs.actual <= 50 ? '✅ Looking healthy and well within limits.' : '⚠️ A bit high; look for bills you can lower.'}
• Wants (Dining out, Entertainment, Shopping): ${rule503020.wants.actual}% (Goal: around 30%) — ${rule503020.wants.actual <= 30 ? '✅ Great discipline on non-essentials!' : '⚠️ Consider trimming some fun spending this month.'}
• Savings & Emergency Fund: ${rule503020.savings.actual}% (Goal: at least 20%) — Fantastic job! You are saving a healthy portion of your earnings.`;
      } else if (lower.includes('vault') || lower.includes('emergency') || lower.includes('runway')) {
        const runway = (summary.totalVaultSavings / (currentExpense || 1)).toFixed(1);
        const boostSavings = Math.round(netSavings * 0.05);
        reply = `Your Emergency Fund currently has ${fmtCurr(summary.totalVaultSavings || 0)}. With your typical monthly spending of ${fmtCurr(currentExpense)}, this covers about ${runway} months of living expenses if unexpected costs pop up.

Financial experts usually recommend having 3 to 6 months saved. Setting aside just a small extra bit (+${fmtCurr(boostSavings)}) each month will help you build an even stronger safety net!`;
      } else if (lower.includes('emi') || lower.includes('debt') || lower.includes('loan')) {
        reply = `When paying off loans and EMIs, the smartest move is to focus on your highest-interest loans first (like credit card balances or personal loans). 

Since you have ${fmtCurr(netSavings)} left over each month, putting a small extra payment towards your loan balance will save you huge amounts of interest and help you become debt-free much faster!`;
      } else {
        reply = `Regarding your question about "${userText}": You have a solid financial foundation with ${fmtCurr(netSavings)} saved each month and ${fmtCurr(summary.totalVaultSavings || 0)} in emergency savings. 

Keep tracking your day-to-day spending, try to put some savings aside right when you get paid, and you will stay on track for your financial goals!`;
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: reply
      }]);
      setIsLoading(false);
    }, 700);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    generateAIResponse(userText);
  };

  const handleStarterClick = (prompt) => {
    if (isLoading) return;
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: prompt
    };
    setMessages(prev => [...prev, userMessage]);
    generateAIResponse(prompt);
  };

  const handleClearChat = () => {
    setMessages([initialMessage]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // fallback
    }
    setIsConfirmResetChatOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean flex flex-col justify-between">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} />

      <main className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#1A1A1A]/10 gap-4 mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#088fff] block mb-2 font-mono">
              FINANCIAL INTELLIGENCE SUITE / GEMINI 1.5 FLASH
            </span>
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight font-editorial text-[#1A1A1A]">
              AI FINANCIAL <span className="italic text-[#088fff]">ADVISOR</span>
            </h1>
            <p className="mt-2 text-sm text-[#1A1A1A]/70 font-light max-w-xl">
              Ask anything about your income, daily spending, savings, or EMIs in simple, easy-to-understand language.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfirmResetChatOpen(true)}
              className="px-3.5 py-2 border border-[#1A1A1A]/15 bg-white hover:bg-gray-100 rounded-sm text-[#1A1A1A]/80 hover:text-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-2 text-xs font-mono font-medium shadow-xs"
              title="Clear Conversation History"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#088fff]" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTAINER: SIDEBAR (LEFT) + CHAT STREAM (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: TELEMETRY BRIEF & PROMPT STARTERS */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Live Telemetry Context Card */}
            <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]/10 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#1A1A1A]/60">
                  Live Snapshot
                </span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A]/60">Monthly Income:</span>
                  <strong className="text-[#1A1A1A]">{fmtCurr(currentIncome)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A]/60">Monthly Spending:</span>
                  <strong className="text-amber-600">{fmtCurr(currentExpense)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A]/60">Money Left Over:</span>
                  <strong className="text-emerald-600">+{fmtCurr(netSavings)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A]/60">Emergency Fund:</span>
                  <strong className="text-[#088fff]">{fmtCurr(summary.totalVaultSavings || 0)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A]/60">50/30/20 Ratio:</span>
                  <span className="text-[#1A1A1A]">{rule503020.needs.actual}/{rule503020.wants.actual}/{rule503020.savings.actual}</span>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="pt-4 mt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between text-[11px] font-mono text-[#088fff]">
                <Link to="/expenses" className="hover:underline flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Ledger</span>
                </Link>
                <span>•</span>
                <Link to="/budget" className="hover:underline flex items-center gap-1">
                  <PiggyBank className="w-3 h-3" />
                  <span>Budget</span>
                </Link>
                <span>•</span>
                <Link to="/emi-studio" className="hover:underline flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span>EMI</span>
                </Link>
              </div>
            </div>

            {/* Prompt Starter Pills */}
            <div className="bg-white rounded-sm border border-[#1A1A1A]/15 p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#1A1A1A]/10 mb-4">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-[#1A1A1A]">
                  Suggested Questions
                </h3>
              </div>

              <div className="space-y-2">
                {promptStarters.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStarterClick(item.prompt)}
                    className="w-full text-left p-3 rounded-sm border border-[#1A1A1A]/10 hover:border-[#088fff] hover:bg-[#088fff]/5 transition-all text-xs group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[#1A1A1A] font-medium group-hover:text-[#088fff]">
                      <span>{item.title}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FULL-HEIGHT CONVERSATION CONTAINER */}
          <div className="lg:col-span-8 bg-white rounded-sm border border-[#1A1A1A]/15 shadow-md flex flex-col h-[650px] overflow-hidden">
            
            {/* Conversation Header */}
            <div className="bg-[#1A1A1A] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-[#088fff] flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-editorial font-bold text-white tracking-wide">
                    Budget Buddy Financial Assistant
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Ledger Connected • Smart 50/30/20 Intelligence
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsConfirmResetChatOpen(true)}
                  className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3 h-3 text-[#088fff]" />
                  <span>Clear Chat</span>
                </button>
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 rounded-sm hidden sm:inline-block">
                  Active Session
                </span>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9F8F5]/60">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-sm bg-[#088fff] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-sm p-4 text-xs sm:text-sm leading-relaxed shadow-xs relative group ${
                      msg.sender === 'user'
                        ? 'bg-[#1A1A1A] text-white font-sans-clean ml-auto'
                        : 'bg-white border border-[#1A1A1A]/15 text-[#1A1A1A] font-sans-clean'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5 text-[9px] font-mono opacity-60">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="hover:opacity-100 flex items-center gap-1 cursor-pointer transition-opacity"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-sm bg-[#1A1A1A] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-[#088fff]" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center text-xs text-[#1A1A1A]/60 font-mono">
                  <div className="w-7 h-7 rounded-sm bg-[#088fff] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                  </div>
                  <div className="bg-white border border-[#1A1A1A]/15 px-4 py-2.5 rounded-sm flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#088fff] animate-ping"></span>
                    <span>Analyzing financial telemetry...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#1A1A1A]/10 flex items-center gap-3 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask advice on your budget, investments, EMI management, or spending..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs sm:text-sm outline-none focus:border-[#088fff] focus:bg-white transition-all font-sans-clean"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#1A1A1A] hover:bg-[#088fff] disabled:opacity-40 text-white px-5 py-3 rounded-sm font-mono text-xs uppercase font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />

      {/* Confirm Reset Chat History Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmResetChatOpen}
        onClose={() => setIsConfirmResetChatOpen(false)}
        onConfirm={handleClearChat}
        title="Clear Conversation?"
        itemName="AI Financial Chat History"
        itemDetails={`${messages.length} messages in current session`}
        message="Are you sure you want to clear your conversation history? This will start a fresh chat session."
        confirmText="Clear Chat"
        dangerLevel="medium"
      />
    </div>
  );
};

export default AiAdvisorPage;
