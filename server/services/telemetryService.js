/**
 * ============================================================================
 * Financial Telemetry Service
 * ============================================================================
 * Pure business logic for calculating Net Worth, 50/30/20 wealth allocation,
 * category distributions, savings rates, and Financial Health Index scores.
 */

/**
 * Computes Monthly Net Worth
 * Formula: Net Worth = (Total Monthly Income - Total Monthly Expenses) + Vault Reserves
 *
 * @param {number} totalIncome - Total recorded income for the period
 * @param {number} totalExpense - Total recorded expenses for the period
 * @param {number} vaultBalance - Liquid emergency vault reserves
 * @returns {number} Calculated net worth (minimum 0)
 */
export const calculateNetWorth = (totalIncome = 0, totalExpense = 0, vaultBalance = 0) => {
  const netSavings = Number(totalIncome) - Number(totalExpense);
  const calculated = netSavings + Number(vaultBalance);
  return Math.max(0, Math.round(calculated));
};

/**
 * Computes Net Savings Rate Percentage
 * Formula: ((Total Income - Total Expenses) / Total Income) * 100
 *
 * @param {number} totalIncome - Total recorded income
 * @param {number} totalExpense - Total recorded expenses
 * @returns {number} Savings rate percentage rounded to 1 decimal place
 */
export const calculateSavingsRate = (totalIncome = 0, totalExpense = 0) => {
  const income = Number(totalIncome);
  const expense = Number(totalExpense);

  if (income <= 0) return 0;
  const netSavings = income - expense;
  const rate = (netSavings / income) * 100;
  return Number(rate.toFixed(1));
};

/**
 * Computes 50/30/20 Wealth Allocation Framework
 * Needs (50% target): Essential living costs (Rent, Groceries, Utilities, EMIs)
 * Wants (30% target): Discretionary spending (Dining, Leisure, Shopping, Subscriptions)
 * Savings (20% target): Reserve accumulation (Vault deposits, SIP investments)
 *
 * @param {number} totalIncome - Total monthly income
 * @param {Array<Object>} transactions - List of user transactions
 * @returns {Object} Target vs actual breakdown percentages
 */
export const calculate503020Rule = (totalIncome = 0, transactions = []) => {
  const income = Number(totalIncome);

  if (income <= 0 || !Array.isArray(transactions) || transactions.length === 0) {
    return {
      needs: { target: 50, actual: 0, amount: 0 },
      wants: { target: 30, actual: 0, amount: 0 },
      savings: { target: 20, actual: 0, amount: 0 }
    };
  }

  // Keywords that classify expenses into 'Needs' vs 'Wants'
  const needsCategories = ['housing', 'groceries', 'utilities', 'emi', 'health', 'rent', 'electricity'];
  const wantsCategories = ['food', 'dining', 'subscription', 'leisure', 'travel', 'shopping', 'entertainment'];

  let needsTotal = 0;
  let wantsTotal = 0;

  const expenseTxs = transactions.filter(t => t.type === 'expense');

  expenseTxs.forEach(tx => {
    const category = (tx.category || '').toLowerCase();
    const amount = Number(tx.amount) || 0;

    if (needsCategories.some(c => category.includes(c))) {
      needsTotal += amount;
    } else if (wantsCategories.some(c => category.includes(c))) {
      wantsTotal += amount;
    } else {
      // Default fallback: 60% needs, 40% wants
      needsTotal += amount * 0.6;
      wantsTotal += amount * 0.4;
    }
  });

  const totalExpense = needsTotal + wantsTotal;
  const netSavings = Math.max(0, income - totalExpense);

  const needsPercent = Math.min(100, Math.round((needsTotal / income) * 100));
  const wantsPercent = Math.min(100, Math.round((wantsTotal / income) * 100));
  const savingsPercent = Math.max(0, Math.round((netSavings / income) * 100));

  return {
    needs: { target: 50, actual: needsPercent, amount: Math.round(needsTotal) },
    wants: { target: 30, actual: wantsPercent, amount: Math.round(wantsTotal) },
    savings: { target: 20, actual: savingsPercent, amount: Math.round(netSavings) }
  };
};

/**
 * Computes Category Spending Distribution
 * Aggregates expenses by category and calculates percentage share of total burn.
 *
 * @param {Array<Object>} transactions - List of transactions
 * @returns {Array<Object>} Sorted category array with amount, percentage, and theme color
 */
export const calculateCategoryBreakdown = (transactions = []) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [{ name: 'General', amount: 0, percent: 0, color: '#088fff' }];
  }

  const expenseTxs = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const categoryMap = {};
  expenseTxs.forEach(tx => {
    const category = tx.category || 'Other';
    categoryMap[category] = (categoryMap[category] || 0) + (Number(tx.amount) || 0);
  });

  const colorPalette = [
    '#088fff', // Electric Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f43f5e', // Rose
    '#64748b'  // Slate
  ];

  const categories = Object.keys(categoryMap)
    .map((name, index) => {
      const amount = categoryMap[name];
      const percent = totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0;
      return {
        name,
        amount: Math.round(amount),
        percent,
        color: colorPalette[index % colorPalette.length]
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return categories.length > 0 ? categories : [{ name: 'General', amount: 0, percent: 0, color: '#088fff' }];
};

/**
 * Computes Financial Health Index (0 - 100 Scale)
 * Pillar 1 (40% Weight): Savings Rate Benchmark (>= 20% scores full marks)
 * Pillar 2 (30% Weight): Discretionary Burn Control (Wants <= 30% scores full marks)
 * Pillar 3 (30% Weight): Vault Emergency Runway (>= 3 months burn scores full marks)
 *
 * @param {number} totalIncome - Monthly income
 * @param {number} totalExpense - Monthly expense
 * @param {number} vaultBalance - Emergency vault balance
 * @param {Array<Object>} transactions - Transaction array
 * @returns {Object} Score (0-100), grade label, and individual pillar breakdown
 */
export const calculateFinancialHealthIndex = (totalIncome = 0, totalExpense = 0, vaultBalance = 0, transactions = []) => {
  const income = Number(totalIncome);
  const expense = Number(totalExpense);
  const vault = Number(vaultBalance);

  if (income <= 0) {
    return {
      score: 50,
      grade: 'Baseline Neutral',
      pillars: { savingsPillar: 20, burnPillar: 15, runwayPillar: 15 }
    };
  }

  // Pillar 1: Savings Rate (Max 40 points)
  const savingsRate = calculateSavingsRate(income, expense);
  const savingsPillar = Math.min(40, Math.round((Math.max(0, savingsRate) / 20) * 40));

  // Pillar 2: Discretionary Burn Control (Max 30 points)
  const rule = calculate503020Rule(income, transactions);
  const wantsRatio = rule.wants.actual;
  let burnPillar = 30;
  if (wantsRatio > 30) {
    const penalty = Math.min(30, (wantsRatio - 30) * 1.5);
    burnPillar = Math.max(5, Math.round(30 - penalty));
  }

  // Pillar 3: Emergency Runway (Max 30 points)
  const monthlyBurn = expense > 0 ? expense : 1;
  const runwayMonths = vault / monthlyBurn;
  const runwayPillar = Math.min(30, Math.round((Math.min(6, runwayMonths) / 3) * 30));

  const totalScore = Math.min(99, Math.max(20, savingsPillar + burnPillar + runwayPillar));

  let grade = 'Needs Attention';
  if (totalScore >= 85) grade = 'Excellent Financial Stability';
  else if (totalScore >= 70) grade = 'Strong Balanced Health';
  else if (totalScore >= 50) grade = 'Moderate Resilience';

  return {
    score: totalScore,
    grade,
    runwayMonths: Number(runwayMonths.toFixed(1)),
    pillars: {
      savingsPillar,
      burnPillar,
      runwayPillar
    }
  };
};

/**
 * Master Telemetry Aggregator
 * Generates the complete portfolio telemetry snapshot.
 *
 * @param {Object} params
 * @param {Object} params.profile - User profile object
 * @param {Array<Object>} params.transactions - Transactions list
 * @param {Object} params.vault - Vault configuration { current, target }
 * @param {Object} params.budget - Budget configuration { monthlyIncome, categories }
 * @returns {Object} Complete telemetry payload matching API specification
 */
export const generateFullTelemetry = ({ profile = {}, transactions = [], vault = {}, budget = {} } = {}) => {
  const incomeTxs = transactions.filter(t => t.type === 'income');
  const expenseTxs = transactions.filter(t => t.type === 'expense');

  const recordedIncome = incomeTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalIncome = recordedIncome > 0 ? recordedIncome : (Number(budget.monthlyIncome) || 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = calculateSavingsRate(totalIncome, totalExpense);
  const vaultSavings = Number(vault.current || 0);
  const netWorth = calculateNetWorth(totalIncome, totalExpense, vaultSavings);

  const categories = calculateCategoryBreakdown(transactions);
  const rule503020 = calculate503020Rule(totalIncome, transactions);
  const healthIndex = calculateFinancialHealthIndex(totalIncome, totalExpense, vaultSavings, transactions);

  return {
    user: profile,
    summary: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      totalVaultSavings: vaultSavings,
      netWorth,
      healthScore: healthIndex.score,
      healthGrade: healthIndex.grade
    },
    categories,
    rule503020,
    healthIndex,
    transactions
  };
};
