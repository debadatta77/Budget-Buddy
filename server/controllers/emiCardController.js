import EmiCard from '../models/EmiCard.js';
import { 
  calculateEmi, 
  getEmiDueStatus, 
  generateAmortizationSchedule 
} from '../services/emiService.js';

/**
 * ============================================================================
 * EMI & Loan Studio Controller
 * ============================================================================
 * Manages user EMI cards, dynamic calendar countdowns, and mathematical loan
 * amortization schedules.
 */

/**
 * Get all user EMI cards with dynamic due countdowns
 * GET /api/v1/emi-cards
 */
export const getEmiCards = async (req, res) => {
  try {
    const cards = await EmiCard.find({ userId: req.user.id }).sort({ dueDay: 1 });

    // Enrich each card with live countdown status from emiService
    const enrichedCards = cards.map(card => {
      const dueStatus = getEmiDueStatus(card.dueDay);
      return {
        id: card._id,
        title: card.title,
        cardLabel: card.cardLabel,
        dueDay: card.dueDay,
        amount: card.amount,
        numericAmount: card.numericAmount,
        latency: card.latency,
        themeGradient: card.themeGradient,
        themeKey: card.themeKey,
        cardNumber: card.cardNumber,
        cardType: card.cardType,
        holderName: card.holderName || '',
        principal: card.principal || 0,
        annualRate: card.annualRate || 0,
        tenureMonths: card.tenureMonths || 0,
        paidInstallments: card.paidInstallments || 0,
        lastPaidDate: card.lastPaidDate || null,
        ...dueStatus
      };
    });

    const totalMonthlyEmi = cards.reduce((sum, c) => sum + (c.numericAmount || 0), 0);

    return res.status(200).json({
      success: true,
      data: enrichedCards,
      summary: {
        cardCount: cards.length,
        totalMonthlyEmi
      }
    });
  } catch (err) {
    console.error('Error fetching EMI cards:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve EMI cards',
      error: err.message
    });
  }
};

/**
 * Add a new loan or recurring EMI card
 * POST /api/v1/emi-cards
 */
export const createEmiCard = async (req, res) => {
  try {
    const { 
      title, 
      numericAmount, 
      dueDay = 15, 
      cardLabel = 'LOAN LEDGER',
      themeGradient, 
      themeKey = 'blue', 
      cardNumber, 
      cardType = 'PERSONAL LOAN EMI',
      holderName = '',
      principal = 0,
      annualRate = 0,
      tenureMonths = 0,
      paidInstallments = 0,
      lastPaidDate = null
    } = req.body;

    if (!title || !numericAmount) {
      return res.status(400).json({
        success: false,
        message: 'Loan title and numericAmount are required'
      });
    }

    const num = Number(numericAmount);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({
        success: false,
        message: 'numericAmount must be a positive number'
      });
    }

    const validDay = Math.min(31, Math.max(1, parseInt(dueDay) || 15));
    const formattedAmount = `₹${Math.round(num).toLocaleString('en-IN')}`;

    const defaultGradient = themeGradient || 'linear-gradient(135deg, #030712 0%, #0284C7 50%, #2563EB 100%)';
    const defaultCardNumber = cardNumber || `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`;

    const newCard = await EmiCard.create({
      userId: req.user.id,
      title: title.trim(),
      cardLabel: cardLabel.trim(),
      dueDay: validDay,
      amount: formattedAmount,
      numericAmount: Math.round(num),
      latency: 'Auto-Debit Active',
      themeGradient: defaultGradient,
      themeKey,
      cardNumber: defaultCardNumber,
      cardType,
      holderName: holderName ? holderName.trim() : '',
      principal: Number(principal) || 0,
      annualRate: Number(annualRate) || 0,
      tenureMonths: Number(tenureMonths) || 0,
      paidInstallments: Number(paidInstallments) || 0,
      lastPaidDate
    });

    const dueStatus = getEmiDueStatus(validDay);

    return res.status(201).json({
      success: true,
      message: 'EMI Card registered to active debt tracker',
      data: {
        id: newCard._id,
        title: newCard.title,
        cardLabel: newCard.cardLabel,
        dueDay: newCard.dueDay,
        amount: newCard.amount,
        numericAmount: newCard.numericAmount,
        latency: newCard.latency,
        themeGradient: newCard.themeGradient,
        themeKey: newCard.themeKey,
        cardNumber: newCard.cardNumber,
        cardType: newCard.cardType,
        holderName: newCard.holderName,
        principal: newCard.principal,
        annualRate: newCard.annualRate,
        tenureMonths: newCard.tenureMonths,
        paidInstallments: newCard.paidInstallments,
        lastPaidDate: newCard.lastPaidDate,
        ...dueStatus
      }
    });
  } catch (err) {
    console.error('Error creating EMI card:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create EMI card',
      error: err.message
    });
  }
};

/**
 * Delete an EMI card
 * DELETE /api/v1/emi-cards/:id
 */
export const deleteEmiCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await EmiCard.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'EMI card not found or you do not have permission to delete it'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'EMI card removed successfully',
      data: { id: card._id }
    });
  } catch (err) {
    console.error('Error deleting EMI card:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete EMI card',
      error: err.message
    });
  }
};

/**
 * Update an EMI card (e.g. increment paid installments, record payment)
 * PUT /api/v1/emi-cards/:id
 */
export const updateEmiCard = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedUpdates = [
      'title', 'cardLabel', 'dueDay', 'amount', 'numericAmount',
      'themeGradient', 'themeKey', 'cardNumber', 'cardType', 'holderName',
      'principal', 'annualRate', 'tenureMonths', 'paidInstallments', 'lastPaidDate'
    ];

    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updatedCard = await EmiCard.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({
        success: false,
        message: 'EMI card not found or you do not have permission to modify it'
      });
    }

    const dueStatus = getEmiDueStatus(updatedCard.dueDay);

    return res.status(200).json({
      success: true,
      message: 'EMI card updated successfully',
      data: {
        id: updatedCard._id,
        title: updatedCard.title,
        cardLabel: updatedCard.cardLabel,
        dueDay: updatedCard.dueDay,
        amount: updatedCard.amount,
        numericAmount: updatedCard.numericAmount,
        latency: updatedCard.latency,
        themeGradient: updatedCard.themeGradient,
        themeKey: updatedCard.themeKey,
        cardNumber: updatedCard.cardNumber,
        cardType: updatedCard.cardType,
        holderName: updatedCard.holderName,
        principal: updatedCard.principal,
        annualRate: updatedCard.annualRate,
        tenureMonths: updatedCard.tenureMonths,
        paidInstallments: updatedCard.paidInstallments,
        lastPaidDate: updatedCard.lastPaidDate,
        ...dueStatus
      }
    });
  } catch (err) {
    console.error('Error updating EMI card:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update EMI card',
      error: err.message
    });
  }
};

/**
 * On-the-fly Loan Amortization Calculation Studio
 * POST /api/v1/emi-cards/calculate
 */
export const calculateAmortization = (req, res) => {
  try {
    const { principal, annualRate, tenureMonths } = req.body;

    if (!principal || !annualRate || !tenureMonths) {
      return res.status(400).json({
        success: false,
        message: 'principal, annualRate, and tenureMonths are required'
      });
    }

    const P = Number(principal);
    const R = Number(annualRate);
    const N = Number(tenureMonths);

    if (P <= 0 || R <= 0 || N <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Principal, annual rate, and tenure must be positive numbers'
      });
    }

    const emiDetails = calculateEmi(P, R, N);
    const schedule = generateAmortizationSchedule(P, R, N);

    return res.status(200).json({
      success: true,
      data: {
        ...emiDetails,
        schedule
      }
    });
  } catch (err) {
    console.error('Error calculating amortization:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate amortization schedule',
      error: err.message
    });
  }
};
