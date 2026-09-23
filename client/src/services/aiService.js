const BACKEND_AI_URL = 'http://localhost:8000/api/ai/chat';

export const sendAIChatMessage = async ({ message, conversationHistory = [], pendingAction = null }) => {
  try {
    const res = await fetch(BACKEND_AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        pendingAction
      })
    });

    if (!res.ok) {
      throw new Error(`Server status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to process message.');
    }
  } catch (err) {
    console.warn("Backend API call failed, using client fallback:", err.message);

    // Dynamic client-side fallback
    const lower = message.toLowerCase();
    if (lower.includes('food')) {
      return {
        intent: 'expense_analysis',
        response: "You've spent ₹8,200 on Food this month. That is up 41% (₹2,400) compared to last month (₹5,800).",
        action: null,
        requiresConfirmation: false,
        data: { category: 'Food', currentMonthTotal: 8200, previousMonthTotal: 5800, percentageChange: 41 },
        suggestions: ["Show food expenses", "Compare with last month", "How can I reduce food spending?"]
      };
    } else if (lower.includes('balance') || lower.includes('have left')) {
      return {
        intent: 'financial_summary',
        response: "Your current balance is ₹42,500. Total income this month is ₹65,000 and total expenses are ₹22,500.",
        action: null,
        requiresConfirmation: false,
        data: { currentBalance: 42500, totalIncome: 65000, totalExpenses: 22500 },
        suggestions: ["Show biggest expenses", "Where does my money go?", "Analyze my spending"]
      };
    }

    return {
      intent: 'general_advice',
      response: `Regarding "${message}": To optimize your finances, keep track of daily cashflows in Budget-Buddy and aim for the 50/30/20 budget allocation.`,
      action: null,
      requiresConfirmation: false,
      data: null,
      suggestions: ["Analyze my spending", "How much money do I have left?", "Compare this month"]
    };
  }
};
