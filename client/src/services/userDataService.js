// Centralized User Data Service with LocalStorage Persistence

const PROFILE_KEY = 'budget_buddy_user_profile';
const TRANSACTIONS_KEY = 'budget_buddy_user_transactions';
const BUDGET_KEY = 'budget_buddy_user_budget';
const GOALS_KEY = 'budget_buddy_user_goals';
const VAULT_KEY = 'budget_buddy_user_vault';
const USERS_KEY = 'budget_buddy_registered_users';

export const DEFAULT_REGISTERED_USERS = [
  { name: 'Priyansu Sekhar', email: 'user@budgetbuddy.app', password: 'password123' },
  { name: 'Demo Member', email: 'demo@budgetbuddy.app', password: 'password123' }
];

export const getRegisteredUsers = () => {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_REGISTERED_USERS;
  } catch {
    return DEFAULT_REGISTERED_USERS;
  }
};

export const findUserByEmail = (email) => {
  if (!email) return null;
  const users = getRegisteredUsers();
  const normalized = email.trim().toLowerCase();
  return users.find(u => u.email.trim().toLowerCase() === normalized) || null;
};

export const cleanUserName = (name, email) => {
  if (!name || name.trim() === '' || name.includes('@') || name.includes(',')) {
    if (email && email.includes('@')) {
      const rawUser = email.split('@')[0];
      const cleaned = rawUser
        .replace(/[._-]/g, ' ')
        .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
      return cleaned || 'Priyansu Sekhar';
    }
    return 'Priyansu Sekhar';
  }
  return name.trim();
};

export const registerNewUser = ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    return {
      success: false,
      message: `An account with email "${email.trim()}" already exists! Please Sign In instead.`
    };
  }

  const cleanName = cleanUserName(name, normalizedEmail);

  const newUser = {
    name: cleanName,
    email: normalizedEmail,
    password: password || 'password123',
    createdAt: new Date().toISOString()
  };

  const currentUsers = getRegisteredUsers();
  const updatedUsers = [...currentUsers, newUser];
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  } catch (err) {
    console.error('Error saving new user:', err);
  }

  return {
    success: true,
    user: newUser,
    message: `Account created successfully for ${newUser.name}!`
  };
};

export const verifyUserCredentials = ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = findUserByEmail(normalizedEmail);

  if (!existing) {
    return {
      success: false,
      reason: 'not_found',
      message: `No account found for "${email.trim()}". You must create an account first!`
    };
  }

  if (password && existing.password && existing.password !== password) {
    return {
      success: false,
      reason: 'invalid_password',
      message: 'Incorrect password! Please check your credentials and try again.'
    };
  }

  const cleanName = cleanUserName(existing.name, existing.email);

  return {
    success: true,
    user: { ...existing, name: cleanName },
    message: `Welcome back, ${cleanName}!`
  };
};

export const DEFAULT_USER_PROFILE = {
  name: 'Priyansu Sekhar',
  email: 'user@budgetbuddy.app',
  currency: 'INR (₹)',
  planTier: 'Pro Member',
  region: 'India (IN)',
  uid: '8904-BUDDY-2026',
  linkedAccounts: [
    { id: 1, bank: 'HDFC Bank', type: 'Primary Checking', number: '•••• 4821', status: 'VERIFIED' },
    { id: 2, bank: 'ICICI Bank', type: 'Credit Specimen', number: '•••• 9102', status: 'VERIFIED' },
    { id: 3, bank: 'SBI Vault', type: 'Savings Account', number: '•••• 3341', status: 'ACTIVE' }
  ]
};

export const DEFAULT_TRANSACTIONS = [
  { id: 1, title: 'Reliance Fresh Supermarket', category: 'Groceries', amount: 1850, type: 'expense', date: '2026-09-18' },
  { id: 2, title: 'Monthly Salary Credit', category: 'Income', amount: 125000, type: 'income', date: '2026-09-17' },
  { id: 3, title: 'Adani Electricity Bill', category: 'Utilities', amount: 2400, type: 'expense', date: '2026-09-16' },
  { id: 4, title: 'Netflix Premium Plan', category: 'Subscription', amount: 649, type: 'expense', date: '2026-09-15' },
  { id: 5, title: 'HDFC Home Loan EMI', category: 'EMI', amount: 18500, type: 'expense', date: '2026-09-10' },
  { id: 6, title: 'Freelance Design Consultation', category: 'Income', amount: 15000, type: 'income', date: '2026-09-08' },
  { id: 7, title: 'Zomato Dining Out', category: 'Food', amount: 1240, type: 'expense', date: '2026-09-05' }
];

export const DEFAULT_BUDGET = {
  monthlyIncome: 125000,
  categories: [
    { id: 1, name: 'Housing & Utilities', allocated: 25000, color: '#088fff' },
    { id: 2, name: 'Groceries & Household', allocated: 15000, color: '#10b981' },
    { id: 3, name: 'EMI & Debt Obligations', allocated: 20000, color: '#f59e0b' },
    { id: 4, name: 'Dining & Entertainment', allocated: 10000, color: '#ec4899' },
    { id: 5, name: 'Emergency Vault & SIP', allocated: 30000, color: '#6366f1' }
  ]
};

export const DEFAULT_SAVINGS_GOALS = [
  { id: 1, title: 'Emergency Fund Vault', target: 200000, current: 145000, category: 'Emergency' },
  { id: 2, title: 'Annual Family Vacation', target: 120000, current: 65000, category: 'Leisure' },
  { id: 3, title: 'New Electric Vehicle Deposit', target: 300000, current: 180000, category: 'Vehicle' }
];

export const DEFAULT_VAULT = {
  current: 145000,
  target: 200000
};

// Profile Helpers
export const getUserProfile = () => {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    const profile = saved ? JSON.parse(saved) : DEFAULT_USER_PROFILE;
    if (profile && profile.name) {
      profile.name = cleanUserName(profile.name, profile.email);
    }
    return profile;
  } catch (err) {
    console.error('Error reading profile:', err);
    return DEFAULT_USER_PROFILE;
  }
};

export const saveUserProfile = (profile) => {
  try {
    const sanitized = {
      ...profile,
      name: cleanUserName(profile.name, profile.email)
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('userDataChanged'));
    return true;
  } catch (err) {
    console.error('Error saving profile:', err);
    return false;
  }
};

// Transaction Helpers
export const getUserTransactions = () => {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  } catch (err) {
    console.error('Error reading transactions:', err);
    return DEFAULT_TRANSACTIONS;
  }
};

export const saveUserTransactions = (txs) => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
    window.dispatchEvent(new Event('userDataChanged'));
    return true;
  } catch (err) {
    console.error('Error saving transactions:', err);
    return false;
  }
};

export const addUserTransaction = (tx) => {
  const current = getUserTransactions();
  const updated = [tx, ...current];
  saveUserTransactions(updated);
  return updated;
};

export const deleteUserTransaction = (id) => {
  const current = getUserTransactions();
  const updated = current.filter(t => t.id !== id);
  saveUserTransactions(updated);
  return updated;
};

export const clearAllTransactions = () => {
  saveUserTransactions([]);
  return [];
};

// Budget Helpers
export const getUserBudget = () => {
  try {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_BUDGET;
  } catch (err) {
    console.error('Error reading budget:', err);
    return DEFAULT_BUDGET;
  }
};

export const saveUserBudget = (budget) => {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
    window.dispatchEvent(new Event('userDataChanged'));
    return true;
  } catch (err) {
    console.error('Error saving budget:', err);
    return false;
  }
};

// Vault Helpers
export const getUserVault = () => {
  try {
    const saved = localStorage.getItem(VAULT_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VAULT;
  } catch (err) {
    console.error('Error reading vault:', err);
    return DEFAULT_VAULT;
  }
};

export const saveUserVault = (vault) => {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    window.dispatchEvent(new Event('userDataChanged'));
    return true;
  } catch (err) {
    console.error('Error saving vault:', err);
    return false;
  }
};

// Savings Goals Helpers
export const getUserSavingsGoals = () => {
  try {
    const saved = localStorage.getItem(GOALS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SAVINGS_GOALS;
  } catch (err) {
    console.error('Error reading savings goals:', err);
    return DEFAULT_SAVINGS_GOALS;
  }
};

export const saveUserSavingsGoals = (goals) => {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    window.dispatchEvent(new Event('userDataChanged'));
    return true;
  } catch (err) {
    console.error('Error saving savings goals:', err);
    return false;
  }
};

export const addUserSavingsGoal = (goal) => {
  const current = getUserSavingsGoals();
  const updated = [...current, goal];
  saveUserSavingsGoals(updated);
  return updated;
};

export const clearAllUserData = () => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
  localStorage.setItem(BUDGET_KEY, JSON.stringify({ monthlyIncome: 0, categories: [] }));
  localStorage.setItem(GOALS_KEY, JSON.stringify([]));
  localStorage.setItem(VAULT_KEY, JSON.stringify({ current: 0, target: 100000 }));
  window.dispatchEvent(new Event('userDataChanged'));
};

export const resetToDemoData = () => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_USER_PROFILE));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
  localStorage.setItem(BUDGET_KEY, JSON.stringify(DEFAULT_BUDGET));
  localStorage.setItem(GOALS_KEY, JSON.stringify(DEFAULT_SAVINGS_GOALS));
  localStorage.setItem(VAULT_KEY, JSON.stringify(DEFAULT_VAULT));
  window.dispatchEvent(new Event('userDataChanged'));
};

// Dynamic Telemetry Computations with Net Worth Logic
export const calculateFinancialTelemetry = () => {
  const profile = getUserProfile();
  const transactions = getUserTransactions();
  const vault = getUserVault();

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

  // Total Vault Savings
  const totalVaultSavings = Number(vault.current || 0);

  /**
   * FINANCIAL FORMULA:
   * Total Net Worth = Net Monthly Cashflow (Monthly Income - Monthly Burn) + Total Vault Reserves
   */
  const calculatedNetWorth = Math.max(0, netSavings + totalVaultSavings);

  // Category Aggregation
  const categoryMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
  });

  const colorPalette = ['#088fff', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
  const categories = Object.keys(categoryMap).map((cat, idx) => {
    const amount = categoryMap[cat];
    const percent = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
    return {
      name: cat,
      amount,
      percent: Number(percent),
      color: colorPalette[idx % colorPalette.length]
    };
  });

  if (categories.length === 0) {
    categories.push({ name: 'General Expenses', amount: 0, percent: 0, color: '#088fff' });
  }

  // 50/30/20 Rule Analysis
  const needsPercent = totalIncome > 0 ? Math.min(100, Math.round((totalExpense * 0.6) / totalIncome * 100)) : 0;
  const wantsPercent = totalIncome > 0 ? Math.min(100, Math.round((totalExpense * 0.4) / totalIncome * 100)) : 0;
  const savingsPercent = totalIncome > 0 ? Math.max(0, Math.round(Number(savingsRate))) : 0;

  return {
    user: profile,
    summary: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: Number(savingsRate),
      totalVaultSavings,
      netWorth: calculatedNetWorth
    },
    categories,
    rule503020: {
      needs: { target: 50, actual: needsPercent },
      wants: { target: 30, actual: wantsPercent },
      savings: { target: 20, actual: savingsPercent }
    },
    transactions
  };
};
