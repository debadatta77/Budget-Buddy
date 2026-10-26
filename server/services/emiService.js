/**
 * ============================================================================
 * EMI & Loan Amortization Service
 * ============================================================================
 * Pure business logic for calculating loan amortization, monthly EMI obligations,
 * interest loads, and calendar due-date countdowns.
 */

/**
 * Standard Banking Loan Amortization Formula
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * @param {number} principal - Loan principal amount (P)
 * @param {number} annualRate - Annual interest rate percentage (e.g. 10.5 for 10.5% p.a.)
 * @param {number} tenureMonths - Total tenure in months (n)
 * @returns {Object} Monthly EMI, total interest, total repayment, and principal/interest ratios
 */
export const calculateEmi = (principal = 0, annualRate = 0, tenureMonths = 1) => {
  const P = Math.max(1000, Number(principal) || 0);
  const annual = Math.max(0.1, Number(annualRate) || 0);
  const n = Math.max(1, Number(tenureMonths) || 1);

  // Monthly interest rate: r = annualRate / (12 * 100)
  const r = annual / (12 * 100);

  // E = P * r * (1+r)^n / ((1+r)^n - 1)
  const numerator = P * r * Math.pow(1 + r, n);
  const denominator = Math.pow(1 + r, n) - 1;
  const emi = Math.round(numerator / denominator);

  const totalPayment = emi * n;
  const totalInterest = Math.max(0, totalPayment - P);
  const principalShare = Number(((P / totalPayment) * 100).toFixed(1));
  const interestShare = Number((100 - principalShare).toFixed(1));

  return {
    principal: P,
    annualRate: annual,
    tenureMonths: n,
    monthlyEmi: emi,
    totalInterest,
    totalPayment,
    principalShare,
    interestShare
  };
};

/**
 * Calculates due date status and days countdown for an active recurring EMI
 *
 * @param {number} dueDay - Day of the month (1-31)
 * @returns {Object} Target due date, next upcoming cycle, and countdown badge
 */
export const getEmiDueStatus = (dueDay = 1) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const validDay = Math.min(31, Math.max(1, parseInt(dueDay) || 1));

  let targetDate = new Date(currentYear, currentMonth, validDay);
  targetDate.setHours(0, 0, 0, 0);

  let nextUpcomingDate;
  if (targetDate >= today) {
    nextUpcomingDate = new Date(currentYear, currentMonth + 1, validDay);
  } else {
    targetDate = new Date(currentYear, currentMonth + 1, validDay);
    nextUpcomingDate = new Date(currentYear, currentMonth + 2, validDay);
  }

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let badgeText = `Due in ${diffDays} days`;
  let urgency = 'normal';

  if (diffDays === 0) {
    badgeText = 'Due Today!';
    urgency = 'critical';
  } else if (diffDays === 1) {
    badgeText = 'Due Tomorrow';
    urgency = 'warning';
  } else if (diffDays <= 3) {
    urgency = 'warning';
  }

  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  return {
    dueDay: validDay,
    diffDays,
    badgeText,
    urgency,
    currentDueDate: formatDate(targetDate),
    nextUpcomingDate: formatDate(nextUpcomingDate)
  };
};

/**
 * Generates month-by-month loan amortization schedule
 *
 * @param {number} principal - Loan principal
 * @param {number} annualRate - Annual interest rate %
 * @param {number} tenureMonths - Tenure in months
 * @returns {Array<Object>} Schedule array showing monthly breakdown
 */
export const generateAmortizationSchedule = (principal = 0, annualRate = 0, tenureMonths = 1) => {
  const { monthlyEmi } = calculateEmi(principal, annualRate, tenureMonths);
  const r = (Number(annualRate) || 0) / (12 * 100);
  const n = Math.max(1, Number(tenureMonths) || 1);

  let balance = Number(principal) || 0;
  const schedule = [];

  for (let month = 1; month <= n; month++) {
    const interestForMonth = Math.round(balance * r);
    const principalForMonth = Math.min(balance, monthlyEmi - interestForMonth);
    balance = Math.max(0, balance - principalForMonth);

    schedule.push({
      month,
      emi: monthlyEmi,
      principalPaid: principalForMonth,
      interestPaid: interestForMonth,
      remainingBalance: balance
    });

    if (balance <= 0) break;
  }

  return schedule;
};
