// Centralized User Data Service with LocalStorage Persistence & MongoDB Sync
import { transactionAPI, budgetAPI, vaultAPI, telemetryAPI, TOKEN_STORAGE_KEY } from './apiClient';

const PROFILE_KEY = 'budget_buddy_user_profile';
const TRANSACTIONS_KEY = 'budget_buddy_user_transactions';
const BUDGET_KEY = 'budget_buddy_user_budget';
const GOALS_KEY = 'budget_buddy_user_goals';
const VAULT_KEY = 'budget_buddy_user_vault';
const USERS_KEY = 'budget_buddy_registered_users';

export const DEFAULT_REGISTERED_USERS = [];

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
      return cleaned || 'Member Account';
    }
    return 'Member Account';
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
  name: 'Member Account',
  email: '',
  currency: 'INR (₹)',
  planTier: 'Pro Member',
  region: 'India (IN)',
  uid: 'BUDDY-NEW-USER',
  linkedAccounts: []
};

export const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Travel',
  'Shopping',
  'Housing',
  'Utilities',
  'Subscription',
  'EMI & Loans',
  'Health',
  'Entertainment',
  'Education',
  'Other'
];

const CATEGORY_ALIAS_MAP = {
  'outside food': 'Food',
  'dining': 'Food',
  'dining out': 'Food',
  'restaurant': 'Food',
  'food & dining': 'Food',
  'snacks': 'Food',
  'transport': 'Travel',
  'transportation': 'Travel',
  'commute': 'Travel',
  'metro': 'Travel',
  'cab': 'Travel',
  'fuel': 'Travel',
  'grocery': 'Groceries',
  'supermarket': 'Groceries',
  'rent': 'Housing',
  'home': 'Housing',
  'bills': 'Utilities',
  'electricity': 'Utilities',
  'water': 'Utilities',
  'internet': 'Utilities',
  'subscriptions': 'Subscription',
  'medical': 'Health',
  'healthcare': 'Health',
  'medicine': 'Health',
  'movies': 'Entertainment',
  'emi': 'EMI & Loans',
  'emi & loans': 'EMI & Loans',
  'loan': 'EMI & Loans',
  'loans': 'EMI & Loans',
  'car loan': 'EMI & Loans',
  'home loan': 'EMI & Loans',
  'personal loan': 'EMI & Loans',
  'education loan': 'EMI & Loans',
  'gold loan': 'EMI & Loans',
  'debt': 'EMI & Loans',
  'obligation': 'EMI & Loans'
};

export const normalizeCategoryName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'Other';
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  if (CATEGORY_ALIAS_MAP[lower]) {
    return CATEGORY_ALIAS_MAP[lower];
  }

  const exactMatch = EXPENSE_CATEGORIES.find(c => c.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  return trimmed;
};

export const normalizeBudgetCategories = (rawCategories = []) => {
  const limitByCategory = new Map();

  // First seed all canonical expense categories with 0 limit
  EXPENSE_CATEGORIES.forEach((catName) => {
    limitByCategory.set(catName, {
      id: `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: catName,
      allocated: 0,
      color: '#088fff'
    });
  });

  // Merge user-configured categories (normalizing aliases like "Outside food" -> "Food", "Transport" -> "Travel")
  if (Array.isArray(rawCategories)) {
    rawCategories.forEach((cat, idx) => {
      if (!cat || !cat.name) return;
      const canonicalName = normalizeCategoryName(cat.name);
      const allocatedVal = Math.max(0, Number(cat.allocated || 0));
      const existing = limitByCategory.get(canonicalName);

      if (existing) {
        limitByCategory.set(canonicalName, {
          ...existing,
          id: cat.id || existing.id,
          allocated: Math.max(existing.allocated, allocatedVal)
        });
      } else {
        limitByCategory.set(canonicalName, {
          id: cat.id || `cat-custom-${idx}`,
          name: canonicalName,
          allocated: allocatedVal,
          color: cat.color || '#088fff'
        });
      }
    });
  }

  return Array.from(limitByCategory.values());
};

export const DEFAULT_TRANSACTIONS = [];

export const DEFAULT_BUDGET = {
  monthlyIncome: 0,
  categories: normalizeBudgetCategories([])
};

export const DEFAULT_SAVINGS_GOALS = [];

export const DEFAULT_VAULT = {
  current: 0,
  target: 100000
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
    if (!saved) return DEFAULT_TRANSACTIONS;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_TRANSACTIONS;

    // Credit cards & EMIs are financial dependencies/liabilities, not direct cash deductions
    // Filter out synthetic debt records so they do not dismantle core cash balance into minus figures
    const filtered = parsed.filter(t => {
      const idStr = String(t?.id || t?._id || '');
      return !idStr.startsWith('tx-cc-') && !idStr.startsWith('tx-emi-');
    });

    if (filtered.length !== parsed.length) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
    }
    return filtered;
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

  // Asynchronously sync to MongoDB Atlas if authenticated
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    transactionAPI.create({
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      notes: tx.notes || ''
    }).then(res => {
      if (res?.data?._id) {
        // Update local item with real MongoDB _id
        const synced = getUserTransactions().map(item =>
          item.id === tx.id ? { ...item, id: res.data._id, _id: res.data._id } : item
        );
        saveUserTransactions(synced);
      }
    }).catch(err => {
      console.warn('Backend sync failed, kept in local cache:', err.message);
    });
  }

  return updated;
};

export const updateUserTransaction = (id, updatedFields) => {
  const current = getUserTransactions();
  let target = null;

  const updated = current.map(tx => {
    if (tx.id === id || tx._id === id) {
      target = {
        ...tx,
        title: updatedFields.title !== undefined ? updatedFields.title.trim() : tx.title,
        amount: updatedFields.amount !== undefined ? Number(updatedFields.amount) : tx.amount,
        type: updatedFields.type !== undefined ? updatedFields.type : tx.type,
        category: updatedFields.category !== undefined ? updatedFields.category : tx.category,
        date: updatedFields.date !== undefined ? updatedFields.date : tx.date
      };
      return target;
    }
    return tx;
  });

  saveUserTransactions(updated);

  // Asynchronously update in MongoDB Atlas if authenticated
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && target) {
    const mongoId = target._id || target.id;
    if (typeof mongoId === 'string' && mongoId.length === 24) {
      transactionAPI.update(mongoId, {
        title: target.title,
        amount: target.amount,
        type: target.type,
        category: target.category,
        date: target.date
      }).catch(err => {
        console.warn('Backend transaction update failed:', err.message);
      });
    }
  }

  return updated;
};

export const deleteUserTransaction = (id) => {
  const current = getUserTransactions();
  const target = current.find(t => t.id === id || t._id === id);
  const updated = current.filter(t => t.id !== id && t._id !== id);
  saveUserTransactions(updated);

  // Asynchronously delete from MongoDB Atlas if authenticated
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && target) {
    const mongoId = target._id || target.id;
    // Only attempt API delete if id looks like MongoDB ObjectId (24 hex chars)
    if (typeof mongoId === 'string' && mongoId.length === 24) {
      transactionAPI.delete(mongoId).catch(err => {
        console.warn('Backend transaction delete failed:', err.message);
      });
    }
  }

  return updated;
};

export const clearAllTransactions = () => {
  saveUserTransactions([]);

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    transactionAPI.clearAll().catch(err => {
      console.warn('Backend transaction clear failed:', err.message);
    });
  }

  return [];
};

// Budget Helpers
export const getUserBudget = () => {
  try {
    const saved = localStorage.getItem(BUDGET_KEY);
    const parsed = saved ? JSON.parse(saved) : DEFAULT_BUDGET;
    return {
      monthlyIncome: Number(parsed?.monthlyIncome || 0),
      categories: normalizeBudgetCategories(parsed?.categories || [])
    };
  } catch (err) {
    console.error('Error reading budget:', err);
    return DEFAULT_BUDGET;
  }
};

export const saveUserBudget = (budget) => {
  try {
    const normalized = {
      ...budget,
      monthlyIncome: Number(budget.monthlyIncome || 0),
      categories: normalizeBudgetCategories(budget.categories || [])
    };
    localStorage.setItem(BUDGET_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event('userDataChanged'));

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      budgetAPI.update({
        monthlyIncome: normalized.monthlyIncome,
        categories: normalized.categories
      }).then(res => {
        if (res?.data) {
          const synced = {
            ...res.data,
            categories: normalizeBudgetCategories(res.data.categories || [])
          };
          localStorage.setItem(BUDGET_KEY, JSON.stringify(synced));
        }
      }).catch(err => {
        console.warn('Backend budget update failed:', err.message);
      });
    }

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

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      vaultAPI.updateSettings(vault).catch(err => {
        console.warn('Backend vault update failed:', err.message);
      });
    }

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
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem('budget_buddy_monthly_report_settings');
  localStorage.removeItem('bb_user_emi_cards');
  localStorage.removeItem('bb_custom_card_specimen');
  localStorage.removeItem('bb_user_custom_card_v2');
  window.dispatchEvent(new Event('userDataChanged'));
};

export const resetToDemoData = () => {
  clearAllUserData();
};

/**
 * Live Synchronization Engine: Pulls user's actual MongoDB Atlas data
 */
export const syncAllFromBackend = async () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    const [txRes, budgetRes, vaultRes, telemetryRes] = await Promise.allSettled([
      transactionAPI.getAll({ limit: 'all' }),
      budgetAPI.get(),
      vaultAPI.get(),
      telemetryAPI.getLive()
    ]);

    if (txRes.status === 'fulfilled' && txRes.value?.success && Array.isArray(txRes.value?.data)) {
      const formatted = txRes.value.data.map(t => ({
        id: t._id,
        _id: t._id,
        title: t.title,
        category: t.category,
        amount: t.amount,
        type: t.type,
        date: t.date?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(formatted));
    }

    if (budgetRes.status === 'fulfilled' && budgetRes.value?.success && budgetRes.value?.data) {
      const normalizedBudget = {
        ...budgetRes.value.data,
        monthlyIncome: Number(budgetRes.value.data.monthlyIncome || 0),
        categories: normalizeBudgetCategories(budgetRes.value.data.categories || [])
      };
      localStorage.setItem(BUDGET_KEY, JSON.stringify(normalizedBudget));
    }

    if (vaultRes.status === 'fulfilled' && vaultRes.value?.success && vaultRes.value?.data) {
      localStorage.setItem(VAULT_KEY, JSON.stringify(vaultRes.value.data));
    }

    window.dispatchEvent(new Event('userDataChanged'));
  } catch (err) {
    console.warn('Backend sync failed, using cached data:', err);
  }
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
    const cat = normalizeCategoryName(t.category || 'Other');
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

  // 50/30/20 Rule Analysis based on real categorized spending
  const NEEDS_CATEGORIES = new Set(['Housing', 'Groceries', 'Utilities', 'Health', 'EMI & Loans', 'Education']);
  let actualNeedsAmount = 0;
  let actualWantsAmount = 0;

  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = normalizeCategoryName(t.category || 'Other');
    const amt = Number(t.amount) || 0;
    if (NEEDS_CATEGORIES.has(cat)) {
      actualNeedsAmount += amt;
    } else {
      actualWantsAmount += amt;
    }
  });

  const needsPercent = totalIncome > 0 ? Math.min(100, Math.round((actualNeedsAmount / totalIncome) * 100)) : 0;
  const wantsPercent = totalIncome > 0 ? Math.min(100, Math.round((actualWantsAmount / totalIncome) * 100)) : 0;
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

// ============================================================================
// Central Credit Card Management & Telemetry
// ============================================================================
const CREDIT_CARDS_KEY = 'budget_buddy_user_credit_cards';

export const getUserCreditCards = () => {
  try {
    const saved = localStorage.getItem(CREDIT_CARDS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveUserCreditCards = (cards) => {
  try {
    const list = Array.isArray(cards) ? cards : [];
    localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('userDataChanged'));
    return list;
  } catch (err) {
    console.error('Error saving user credit cards:', err);
    return [];
  }
};

export const addUserCreditCard = (card) => {
  const cards = getUserCreditCards();
  const newCard = {
    id: card.id || `cc-${Date.now()}`,
    cardName: card.cardName || 'Credit Card',
    bankName: card.bankName || 'Bank',
    network: card.network || 'Visa',
    creditLimit: Number(card.creditLimit) || 0,
    currentBalance: Number(card.currentBalance) || 0,
    statementDay: Math.min(31, Math.max(1, Number(card.statementDay) || 15)),
    dueDay: Math.min(31, Math.max(1, Number(card.dueDay) || 5)),
    last4: card.last4 ? String(card.last4).slice(-4) : '4821',
    holderName: card.holderName || '',
    themeKey: card.themeKey || 'midnight',
    lastPaidDate: card.lastPaidDate || '',
    createdAt: new Date().toISOString()
  };

  const updated = [newCard, ...cards];
  saveUserCreditCards(updated);
  return newCard;
};

export const updateUserCreditCard = (id, updates) => {
  const cards = getUserCreditCards();
  const updated = cards.map(c => (c.id === id ? { ...c, ...updates } : c));
  saveUserCreditCards(updated);
  return updated;
};

export const deleteUserCreditCard = (id) => {
  const cards = getUserCreditCards();
  const updated = cards.filter(c => c.id !== id);
  saveUserCreditCards(updated);
  return updated;
};

// Liabilities & Debt Dependencies Summary
export const getUserLiabilitiesSummary = () => {
  const creditCards = getUserCreditCards();
  let emiCards = [];
  try {
    const saved = localStorage.getItem('bb_user_emi_cards');
    if (saved) emiCards = JSON.parse(saved);
  } catch {}

  const totalCreditLimit = creditCards.reduce((acc, c) => acc + (Number(c.creditLimit) || 0), 0);
  const totalCreditDue = creditCards.reduce((acc, c) => acc + (Number(c.currentBalance) || 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditDue / totalCreditLimit) * 100 : 0;

  const totalMonthlyEmi = emiCards.reduce((acc, c) => {
    const val = typeof c.numericAmount === 'number' ? c.numericAmount : Number(String(c.amount || '').replace(/[^0-9.]/g, '')) || 0;
    return acc + val;
  }, 0);

  return {
    totalCreditLimit,
    totalCreditDue,
    creditUtilization: Number(creditUtilization.toFixed(1)),
    totalMonthlyEmi,
    activeCreditCardsCount: creditCards.length,
    activeEmisCount: emiCards.length
  };
};


