import User from '../models/User.js';
import Budget from '../models/Budget.js';
import Vault from '../models/Vault.js';
import Transaction from '../models/Transaction.js';
import { generateFullTelemetry } from '../services/telemetryService.js';

/**
 * ============================================================================
 * Financial Telemetry Controller
 * ============================================================================
 * Aggregates user profile, active budget configuration, liquid vault reserves,
 * and ledger transactions to generate a real-time, synchronized portfolio snapshot.
 * Eliminates data drift across all frontend components.
 */

/**
 * Fetch live calculated telemetry for authenticated user
 * GET /api/v1/telemetry/live
 */
export const getLiveTelemetry = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all related entities in parallel for optimal throughput
    const [user, budget, vault, transactions] = await Promise.all([
      User.findById(userId).select('-password'),
      Budget.findOne({ userId }),
      Vault.findOne({ userId }),
      Transaction.find({ userId }).sort({ date: -1, createdAt: -1 })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Default fallbacks if models haven't been seeded yet
    const safeBudget = budget || {
      monthlyIncome: 0,
      categories: []
    };

    const safeVault = vault || {
      current: 0,
      target: 100000
    };

    // Calculate full dynamic telemetry without storing redundant static metrics
    const telemetry = generateFullTelemetry({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        planTier: user.planTier,
        accountUid: user.accountUid
      },
      transactions: transactions.map(t => ({
        id: t._id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date.toISOString().split('T')[0]
      })),
      vault: safeVault,
      budget: safeBudget
    });

    return res.status(200).json({
      success: true,
      data: telemetry
    });
  } catch (err) {
    console.error('Error computing telemetry:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute live portfolio telemetry',
      error: err.message
    });
  }
};
