import { GoogleGenAI } from '@google/genai';
import User from '../models/User.js';
import Budget from '../models/Budget.js';
import Vault from '../models/Vault.js';
import Transaction from '../models/Transaction.js';
import { generateFullTelemetry } from '../services/telemetryService.js';
import { buildGeminiPrompt, generateContextAwareFallback } from '../services/aiContextService.js';

/**
 * ============================================================================
 * AI Financial Advisor Controller
 * ============================================================================
 * Interfaces with Google Gemini 2.5 Flash via @google/genai SDK, injecting
 * live portfolio telemetry into every prompt. Includes autonomous domain-aware
 * fallback engine when API keys are absent or network requests timeout.
 */

/**
 * Chat with AI Financial Advisor
 * POST /api/v1/ai/chat
 */
export const chatWithAdvisor = async (req, res) => {
  try {
    const { message, strategyMode = 'balanced', currency, clientTelemetry } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A message prompt is required'
      });
    }

    const userId = req.user.id;

    // Fetch live user financial state to inject telemetry context
    const [user, budget, vault, transactions] = await Promise.all([
      User.findById(userId).select('-password'),
      Budget.findOne({ userId }),
      Vault.findOne({ userId }),
      Transaction.find({ userId }).sort({ date: -1 }).limit(30)
    ]);

    const activeCurrency = currency || user?.currency || '₹';

    let telemetry = generateFullTelemetry({
      profile: user ? { ...user.toObject(), currency: activeCurrency } : { currency: activeCurrency },
      transactions: (transactions || []).map(t => ({
        id: t._id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date?.toISOString().split('T')[0] || ''
      })),
      vault: vault || { current: 0, target: 100000 },
      budget: budget || { monthlyIncome: 0, categories: [] }
    });

    // If MongoDB has no transactions yet (e.g. fresh session / local-first logs), fallback to live client telemetry
    const hasDbActivity = (transactions && transactions.length > 0) || (budget && Number(budget.monthlyIncome) > 0);
    if (!hasDbActivity && clientTelemetry && clientTelemetry.summary) {
      const clientSummary = clientTelemetry.summary;
      const clientIncome = Number(clientSummary.totalIncome) || 0;
      const clientExpense = Number(clientSummary.totalExpense) || 0;
      const clientVault = Number(clientSummary.totalVaultSavings) || 0;

      if (clientIncome > 0 || clientExpense > 0 || clientVault > 0) {
        telemetry = {
          ...telemetry,
          summary: {
            ...telemetry.summary,
            totalIncome: clientIncome || telemetry.summary.totalIncome,
            totalExpense: clientExpense || telemetry.summary.totalExpense,
            netSavings: clientSummary.netSavings !== undefined ? Number(clientSummary.netSavings) : (clientIncome - clientExpense),
            savingsRate: clientSummary.savingsRate !== undefined ? Number(clientSummary.savingsRate) : telemetry.summary.savingsRate,
            totalVaultSavings: clientVault || telemetry.summary.totalVaultSavings,
            netWorth: clientSummary.netWorth !== undefined ? Number(clientSummary.netWorth) : telemetry.summary.netWorth
          },
          categories: Array.isArray(clientTelemetry.categories) && clientTelemetry.categories.length > 0 && !clientTelemetry.categories[0]?.isEmpty
            ? clientTelemetry.categories
            : telemetry.categories,
          rule503020: clientTelemetry.rule503020 || telemetry.rule503020
        };
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is configured, attempt live LLM synthesis
    if (apiKey && apiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        const prompt = buildGeminiPrompt({
          telemetry,
          strategyMode,
          userQuery: message.trim(),
          currencySymbol: activeCurrency
        });

        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt
          });
        } catch (liteErr) {
          console.warn('gemini-flash-lite-latest busy, trying gemini-flash-latest:', liteErr.message);
          response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt
          });
        }

        const replyText = response?.text;

        if (replyText && replyText.trim()) {
          return res.status(200).json({
            success: true,
            provider: 'google_gemini_flash',
            strategyMode,
            data: {
              reply: replyText.trim(),
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (geminiError) {
        console.warn('Google GenAI generation encountered an error, activating domain fallback:', geminiError.message);
        // Seamlessly continue down to local fallback
      }
    }

    // Local Domain-Aware Fallback Engine (Runs offline or when Gemini key is omitted)
    const fallbackReply = generateContextAwareFallback(message.trim(), telemetry, activeCurrency);

    return res.status(200).json({
      success: true,
      provider: 'domain_telemetry_engine',
      strategyMode,
      data: {
        reply: fallbackReply,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('AI Advisor Controller Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI Financial Advisor query',
      error: err.message
    });
  }
};
