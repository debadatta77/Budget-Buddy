import { useState, useEffect } from 'react';

export const CURRENCY_CONFIG = {
  'INR (₹)': { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  'USD ($)': { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  'EUR (€)': { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  'GBP (£)': { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
  'INR': { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  'USD': { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  'EUR': { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  'GBP': { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' }
};

export const DEFAULT_CURRENCY = 'INR (₹)';

export const getActiveCurrency = () => {
  try {
    const saved = localStorage.getItem('budget_buddy_user_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.currency && CURRENCY_CONFIG[parsed.currency]) {
        return parsed.currency;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_CURRENCY;
};

export const getCurrencyConfig = (currencyStr) => {
  if (currencyStr && CURRENCY_CONFIG[currencyStr]) {
    return CURRENCY_CONFIG[currencyStr];
  }
  return CURRENCY_CONFIG[DEFAULT_CURRENCY];
};

export const getCurrencySymbol = (currencyStr) => {
  return getCurrencyConfig(currencyStr || getActiveCurrency()).symbol;
};

export const formatCurrency = (amount, currencyOrOptions) => {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  
  let curr = getActiveCurrency();
  let maxDecimals = 0;
  let showSymbol = true;

  if (typeof currencyOrOptions === 'string') {
    curr = currencyOrOptions;
  } else if (typeof currencyOrOptions === 'object' && currencyOrOptions !== null) {
    if (currencyOrOptions.currency) curr = currencyOrOptions.currency;
    if (currencyOrOptions.decimals !== undefined) maxDecimals = currencyOrOptions.decimals;
    if (currencyOrOptions.showSymbol !== undefined) showSymbol = currencyOrOptions.showSymbol;
  }

  const config = getCurrencyConfig(curr);
  const isNegative = numeric < 0;
  const absAmount = Math.abs(numeric);

  const formattedNumber = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: maxDecimals,
    maximumFractionDigits: maxDecimals
  }).format(absAmount);

  if (!showSymbol) {
    return isNegative ? `-${formattedNumber}` : formattedNumber;
  }
  return isNegative ? `-${config.symbol}${formattedNumber}` : `${config.symbol}${formattedNumber}`;
};

export const formatCompact = (amount, currencyOrOptions) => {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0;
  let curr = getActiveCurrency();
  if (typeof currencyOrOptions === 'string') curr = currencyOrOptions;
  else if (typeof currencyOrOptions === 'object' && currencyOrOptions?.currency) curr = currencyOrOptions.currency;

  const config = getCurrencyConfig(curr);
  const symbol = config.symbol;
  const isNegative = numeric < 0;
  const abs = Math.abs(numeric);

  let formatted = '';
  if (config.code === 'INR') {
    if (abs >= 10000000) {
      formatted = `${(abs / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
    } else if (abs >= 100000) {
      formatted = `${(abs / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    } else if (abs >= 1000) {
      formatted = `${(abs / 1000).toFixed(0)}k`;
    } else {
      formatted = `${abs}`;
    }
  } else {
    if (abs >= 1000000) {
      formatted = `${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    } else if (abs >= 1000) {
      formatted = `${(abs / 1000).toFixed(0)}k`;
    } else {
      formatted = `${abs}`;
    }
  }

  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState(() => getActiveCurrency());

  useEffect(() => {
    const handleSync = () => {
      const active = getActiveCurrency();
      setCurrency(active);
    };

    window.addEventListener('userDataChanged', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('userDataChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const config = getCurrencyConfig(currency);

  const boundFormatCurrency = (amount, options = {}) => {
    return formatCurrency(amount, { currency, ...options });
  };

  const boundFormatCompact = (amount) => {
    return formatCompact(amount, currency);
  };

  return {
    currency,
    code: config.code,
    symbol: config.symbol,
    locale: config.locale,
    formatCurrency: boundFormatCurrency,
    formatCompact: boundFormatCompact
  };
};

export default formatCurrency;
