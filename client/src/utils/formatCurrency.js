export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  if (typeof amount !== 'number') return '₹0';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
};

export default formatCurrency;