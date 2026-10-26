/**
 * ============================================================================
 * AI Financial Context & Reasoning Service
 * ============================================================================
 * Compiles dynamic user financial telemetry into a structured system prompt
 * for Google Gemini, and provides context-aware fallback generation.
 */

/**
 * Normalizes user currency string to its active symbol ($, €, £, or ₹)
 */
export const resolveCurrencySymbol = (currencyStr) => {
  if (!currencyStr) return '₹';
  const str = String(currencyStr).trim();
  if (str.includes('$') || str === 'USD') return '$';
  if (str.includes('€') || str === 'EUR') return '€';
  if (str.includes('£') || str === 'GBP') return '£';
  if (str.includes('₹') || str === 'INR') return '₹';
  return str.length === 1 ? str : '₹';
};

/**
 * Formats monetary amounts with proper locale and currency symbol
 */
export const formatCurrencyAmount = (amount, symbol = '₹') => {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const locale = symbol === '₹' ? 'en-IN' : symbol === '€' ? 'de-DE' : symbol === '£' ? 'en-GB' : 'en-US';
  const formatted = absNum.toLocaleString(locale);
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

/**
 * Builds the system and user prompt with injected telemetry context
 *
 * @param {Object} params
 * @param {Object} params.telemetry - Full user telemetry object
 * @param {string} params.strategyMode - 'balanced' | 'aggressive' | 'frugal'
 * @param {string} params.userQuery - User's question
 * @param {string} [params.currencySymbol] - User's active currency symbol
 * @returns {string} Final prompt string ready for Google Gemini API
 */
export const buildGeminiPrompt = ({ telemetry = {}, strategyMode = 'balanced', userQuery = '', currencySymbol = '₹' }) => {
  const { summary = {}, categories = [], rule503020 = {}, user = {} } = telemetry;
  const resolvedSymbol = resolveCurrencySymbol(currencySymbol || user?.currency);

  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = summary.netSavings || 0;
  const savingsRate = summary.savingsRate || 0;
  const vaultBalance = summary.totalVaultSavings || 0;

  const topCats = categories
    .slice(0, 3)
    .map(c => `${c.name}: ${formatCurrencyAmount(c.amount, resolvedSymbol)} (${c.percent}%)`)
    .join(', ') || 'None recorded yet';

  return `
You are a friendly, helpful personal financial advisor for Budget Buddy.
You help everyday people understand their finances and make smart money choices.

COMMUNICATION RULES (VERY IMPORTANT):
- Speak in simple, friendly, easy-to-understand plain English.
- DO NOT use complicated financial jargon or robotic corporate words (e.g. avoid words like "burn rate", "liquidity", "telemetry", "operational runway", "discretionary variance", "outflow aggregate").
- Instead, use everyday friendly phrases like "monthly spending", "take-home income", "money left over", "emergency fund", "savings cushion", and "needs vs wants".
- Keep answers practical, encouraging, and clear (2 to 3 short paragraphs or bullet points).
- Reference the user's actual numbers with ${resolvedSymbol} when helpful so the advice is personal to them.
- Naturally adapt to whatever the user is asking about (if they ask about investing, guide them towards growing their wealth; if they ask about saving or debt, help them with budgeting and paying off bills).
- Finish with 1 simple, practical step they can take today.

=== USER FINANCIAL SNAPSHOT ===
- Preferred Currency: ${resolvedSymbol}
- Monthly Income: ${formatCurrencyAmount(totalIncome, resolvedSymbol)}
- Monthly Expenses (Spending): ${formatCurrencyAmount(totalExpense, resolvedSymbol)}
- Money Left Over (Monthly Savings): ${formatCurrencyAmount(netSavings, resolvedSymbol)} (Savings Rate: ${savingsRate}%)
- Emergency Fund (Vault Savings): ${formatCurrencyAmount(vaultBalance, resolvedSymbol)}
- 50/30/20 Budget Breakdown: Needs ${rule503020.needs?.actual || 0}% (Target 50%), Wants ${rule503020.wants?.actual || 0}% (Target 30%), Savings ${rule503020.savings?.actual || 0}% (Target 20%)
- Top Spending Categories: ${topCats}
==============================

User Question: "${userQuery}"
`.trim();
};

/**
 * Context-aware local AI fallback generator
 * Generates tailored domain-specific advice based on real numbers if Gemini API is offline.
 *
 * @param {string} userQuery - The user's input question
 * @param {Object} telemetry - Full user telemetry snapshot
 * @param {string} [currencySymbol] - User's active currency symbol
 * @returns {string} Tailored financial advice response
 */
export const generateContextAwareFallback = (userQuery = '', telemetry = {}, currencySymbol = '₹') => {
  const { summary = {}, categories = [], rule503020 = {}, user = {} } = telemetry;
  const sym = resolveCurrencySymbol(currencySymbol || user?.currency);
  const lower = (userQuery || '').toLowerCase();

  const income = Number(summary.totalIncome) || 0;
  const expense = Number(summary.totalExpense) || 0;
  const netSavings = summary.netSavings !== undefined ? summary.netSavings : (income - expense);
  const savingsRate = Number(summary.savingsRate) || 0;
  const vault = Number(summary.totalVaultSavings) || 0;
  const topCat = categories[0] || { name: 'Essentials', amount: Math.round(expense * 0.4), percent: 40 };

  if (lower.includes('analyze') || lower.includes('spending') || lower.includes('burn')) {
    return `Looking at your finances, you spend about ${formatCurrencyAmount(expense, sym)} each month from your ${formatCurrencyAmount(income, sym)} income. This leaves you with a great savings cushion of ${formatCurrencyAmount(netSavings, sym)} every month (saving ${savingsRate}% of what you earn).

Your highest expense is ${topCat.name} at ${formatCurrencyAmount(topCat.amount, sym)} (${topCat.percent}% of what you spend). Keeping a close eye on this category is the easiest way to keep more money in your pocket!`;
  }

  if (lower.includes('50/30/20') || lower.includes('rule') || lower.includes('budget')) {
    const needs = rule503020.needs?.actual || 28;
    const wants = rule503020.wants?.actual || 18;
    const savings = rule503020.savings?.actual || 54;
    return `Here is a simple look at your budget using the popular 50/30/20 guideline:

• Needs (Rent, Bills, Groceries): ${needs}% of spending (Target: around 50%) — ${needs <= 50 ? '✅ Looking healthy and well within limits.' : '⚠️ A bit high; look for bills you can lower.'}
• Wants (Dining out, Entertainment, Shopping): ${wants}% of spending (Target: around 30%) — ${wants <= 30 ? '✅ Great discipline on non-essentials!' : '⚠️ Consider trimming some fun spending this month.'}
• Savings & Emergency Fund: ${savings}% (Target: at least 20%) — Fantastic job! You are saving a healthy portion of your earnings.`;
  }

  if (lower.includes('vault') || lower.includes('emergency') || lower.includes('runway')) {
    const runway = (vault / (expense || 1)).toFixed(1);
    const boostSavings = Math.round(netSavings * 0.05);
    return `Your Emergency Fund currently has ${formatCurrencyAmount(vault, sym)}. With your typical monthly spending of ${formatCurrencyAmount(expense, sym)}, this covers about ${runway} months of living expenses if you ever faced an unexpected emergency.

Financial experts usually recommend having 3 to 6 months saved. Setting aside just a small extra bit (+${formatCurrencyAmount(boostSavings, sym)}) each month will help you reach that peace of mind easily!`;
  }

  if (lower.includes('emi') || lower.includes('debt') || lower.includes('loan')) {
    return `When paying off loans and EMIs, the smartest move is to focus on your highest-interest loans first (like credit card balances or personal loans). 

Since you have ${formatCurrencyAmount(netSavings, sym)} left over each month, putting a small extra payment towards your loan balance will save you huge amounts of interest and help you become debt-free much faster!`;
  }

  return `Regarding your question about "${userQuery}": You have a solid financial foundation with ${formatCurrencyAmount(netSavings, sym)} saved each month and ${formatCurrencyAmount(vault, sym)} in emergency savings. 

Keep tracking your day-to-day spending, try to put some savings aside right when you get paid, and you will stay on track for your financial goals!`;
};
