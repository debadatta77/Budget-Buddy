import Vault from '../models/Vault.js';
import Transaction from '../models/Transaction.js';

/**
 * ============================================================================
 * Emergency Vault Controller
 * ============================================================================
 * Manages liquid cash reserves, deposits, withdrawals, and target runway tracking.
 */

/**
 * Get user emergency vault status
 * GET /api/v1/vault
 */
export const getVault = async (req, res) => {
  try {
    let vault = await Vault.findOne({ userId: req.user.id });

    if (!vault) {
      vault = await Vault.create({
        userId: req.user.id,
        current: 0,
        target: 100000
      });
    }

    // Estimate monthly burn from recent expense transactions to calculate runway
    const expenseTxs = await Transaction.find({
      userId: req.user.id,
      type: 'expense'
    });
    const totalBurn = expenseTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthlyBurn = totalBurn;
    const runwayMonths = monthlyBurn > 0 ? Number((vault.current / monthlyBurn).toFixed(1)) : 0;
    const progressPercent = vault.target > 0 ? Math.min(100, Math.round((vault.current / vault.target) * 100)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        id: vault._id,
        current: vault.current,
        target: vault.target,
        progressPercent,
        runwayMonths,
        monthlyBurn
      }
    });
  } catch (err) {
    console.error('Error fetching vault:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vault details',
      error: err.message
    });
  }
};

/**
 * Deposit funds into emergency vault
 * POST /api/v1/vault/deposit
 */
export const depositVault = async (req, res) => {
  try {
    const { amount, recordTransaction = true } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be a positive number'
      });
    }

    let vault = await Vault.findOne({ userId: req.user.id });
    if (!vault) {
      vault = new Vault({ userId: req.user.id, current: 0, target: 200000 });
    }

    vault.current += numAmount;
    await vault.save();

    // Optionally record a ledger transaction for audit trail
    if (recordTransaction) {
      await Transaction.create({
        userId: req.user.id,
        title: 'Emergency Vault Deposit',
        category: 'Emergency Vault & SIP',
        amount: numAmount,
        type: 'expense',
        notes: 'Automated deposit to liquid emergency reserves'
      });
    }

    const progressPercent = Math.min(100, Math.round((vault.current / vault.target) * 100));

    return res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${numAmount.toLocaleString('en-IN')} to Emergency Vault`,
      data: {
        current: vault.current,
        target: vault.target,
        progressPercent
      }
    });
  } catch (err) {
    console.error('Error depositing to vault:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process vault deposit',
      error: err.message
    });
  }
};

/**
 * Withdraw funds from emergency vault
 * POST /api/v1/vault/withdraw
 */
export const withdrawVault = async (req, res) => {
  try {
    const { amount, recordTransaction = true } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount must be a positive number'
      });
    }

    let vault = await Vault.findOne({ userId: req.user.id });
    if (!vault || vault.current < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient vault reserves. Current balance is ₹${(vault?.current || 0).toLocaleString('en-IN')}`
      });
    }

    vault.current -= numAmount;
    await vault.save();

    if (recordTransaction) {
      await Transaction.create({
        userId: req.user.id,
        title: 'Emergency Vault Liquidation',
        category: 'Vault Withdrawal',
        amount: numAmount,
        type: 'income',
        notes: 'Emergency reserves withdrawn into liquid operating cash'
      });
    }

    const progressPercent = Math.min(100, Math.round((vault.current / vault.target) * 100));

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew ₹${numAmount.toLocaleString('en-IN')} from Emergency Vault`,
      data: {
        current: vault.current,
        target: vault.target,
        progressPercent
      }
    });
  } catch (err) {
    console.error('Error withdrawing from vault:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process vault withdrawal',
      error: err.message
    });
  }
};

/**
 * Update vault target reserve goal
 * PUT /api/v1/vault/settings
 */
export const updateVaultSettings = async (req, res) => {
  try {
    const { target, current } = req.body;

    let vault = await Vault.findOne({ userId: req.user.id });
    if (!vault) {
      vault = new Vault({ userId: req.user.id });
    }

    if (target !== undefined) {
      const numTarget = Number(target);
      if (isNaN(numTarget) || numTarget < 1000) {
        return res.status(400).json({
          success: false,
          message: 'Target must be at least ₹1,000'
        });
      }
      vault.target = numTarget;
    }

    if (current !== undefined) {
      const numCurrent = Number(current);
      if (isNaN(numCurrent) || numCurrent < 0) {
        return res.status(400).json({
          success: false,
          message: 'Current balance must be a non-negative number'
        });
      }
      vault.current = numCurrent;
    }

    await vault.save();

    return res.status(200).json({
      success: true,
      message: 'Vault settings updated successfully',
      data: vault
    });
  } catch (err) {
    console.error('Error updating vault settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vault settings',
      error: err.message
    });
  }
};
