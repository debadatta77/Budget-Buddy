import Budget from '../models/Budget.js';

/**
 * ============================================================================
 * Budget Controller
 * ============================================================================
 * Handles user monthly baseline income and category spending allocations.
 */

/**
 * Get user budget settings and category allocations
 * GET /api/v1/budget
 */
export const getBudget = async (req, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.user.id });

    if (!budget) {
      budget = await Budget.create({
        userId: req.user.id,
        monthlyIncome: 0,
        categories: []
      });
    }

    const totalAllocated = budget.categories.reduce((sum, c) => sum + (c.allocated || 0), 0);
    const unallocated = Math.max(0, budget.monthlyIncome - totalAllocated);

    return res.status(200).json({
      success: true,
      data: {
        id: budget._id,
        monthlyIncome: budget.monthlyIncome,
        categories: budget.categories,
        totalAllocated,
        unallocated
      }
    });
  } catch (err) {
    console.error('Error fetching budget:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve budget settings',
      error: err.message
    });
  }
};

/**
 * Update monthly income and/or category allocations
 * PUT /api/v1/budget
 */
export const updateBudget = async (req, res) => {
  try {
    const { monthlyIncome, categories } = req.body;

    let budget = await Budget.findOne({ userId: req.user.id });

    if (!budget) {
      budget = new Budget({ userId: req.user.id });
    }

    if (monthlyIncome !== undefined) {
      const inc = Number(monthlyIncome);
      if (isNaN(inc) || inc < 0) {
        return res.status(400).json({
          success: false,
          message: 'Monthly income must be a valid non-negative number'
        });
      }
      budget.monthlyIncome = inc;
    }

    if (categories && Array.isArray(categories)) {
      budget.categories = categories.map(cat => ({
        name: (cat.name || 'Category').trim(),
        allocated: Math.max(0, Number(cat.allocated) || 0),
        color: cat.color || '#088fff'
      }));
    }

    await budget.save();

    const totalAllocated = budget.categories.reduce((sum, c) => sum + (c.allocated || 0), 0);
    const unallocated = Math.max(0, budget.monthlyIncome - totalAllocated);

    return res.status(200).json({
      success: true,
      message: 'Budget settings updated successfully',
      data: {
        id: budget._id,
        monthlyIncome: budget.monthlyIncome,
        categories: budget.categories,
        totalAllocated,
        unallocated
      }
    });
  } catch (err) {
    console.error('Error updating budget:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update budget settings',
      error: err.message
    });
  }
};
