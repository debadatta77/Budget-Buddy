import Transaction from '../models/Transaction.js';

/**
 * ============================================================================
 * Transaction Controller
 * ============================================================================
 * Manages full CRUD operations for income and expense transactions.
 * Centralized ledger ensuring consistent state across the entire user portfolio.
 */

/**
 * Get all transactions with search, filter, and pagination
 * GET /api/v1/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const { type, category, search, limit = 50, page = 1 } = req.query;

    const query = { userId: req.user.id };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (category && category !== 'All Categories') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const isFetchAll = limit === 'all' || Number(limit) === 0;
    const numLimit = isFetchAll ? 0 : Number(limit);
    const skip = isFetchAll ? 0 : (Number(page) - 1) * numLimit;

    const findQuery = Transaction.find(query).sort({ date: -1, createdAt: -1 });
    if (!isFetchAll) {
      findQuery.skip(skip).limit(numLimit);
    }

    const [transactions, totalCount] = await Promise.all([
      findQuery,
      Transaction.countDocuments(query)
    ]);

    // Calculate aggregated metrics for the user's entire dataset
    const allUserTxs = await Transaction.find({ userId: req.user.id });
    const totalIncome = allUserTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = allUserTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / Number(limit))
      },
      summary: {
        totalIncome,
        totalExpense,
        netCashflow: totalIncome - totalExpense
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: err.message
    });
  }
};

/**
 * Create a new transaction
 * POST /api/v1/transactions
 */
export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;

    if (!title || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, and type (income or expense) are required'
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    if (!['income', 'expense'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be "income" or "expense"'
      });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      title: title.trim(),
      amount: numAmount,
      type: type.toLowerCase(),
      category: category ? category.trim() : 'General',
      date: date ? new Date(date) : new Date(),
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} record added successfully`,
      data: transaction
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: err.message
    });
  }
};

/**
 * Update an existing transaction
 * PUT /api/v1/transactions/:id
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId: req.user.id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you do not have permission to edit it'
      });
    }

    if (title !== undefined) transaction.title = title.trim();
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number'
        });
      }
      transaction.amount = numAmount;
    }
    if (type !== undefined) {
      if (!['income', 'expense'].includes(type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Transaction type must be "income" or "expense"'
        });
      }
      transaction.type = type.toLowerCase();
    }
    if (category !== undefined) transaction.category = category.trim();
    if (date !== undefined) transaction.date = new Date(date);
    if (notes !== undefined) transaction.notes = notes.trim();

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: err.message
    });
  }
};

/**
 * Delete a transaction
 * DELETE /api/v1/transactions/:id
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you do not have permission to delete it'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: transaction._id }
    });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: err.message
    });
  }
};

/**
 * Clear all transactions for the user
 * DELETE /api/v1/transactions/clear/all
 */
export const clearAllTransactions = async (req, res) => {
  try {
    const result = await Transaction.deleteMany({ userId: req.user.id });

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} transactions from your ledger`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing transactions:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear transactions',
      error: err.message
    });
  }
};
