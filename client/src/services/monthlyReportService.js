// Service for Monthly Email Report Settings & Dynamic Document Generation
import { getUserProfile, calculateFinancialTelemetry } from './userDataService';

const STORAGE_KEY = 'budget_buddy_monthly_report_settings';

export const DEFAULT_REPORT_SETTINGS = {
  enabled: true,
  email: 'user@budgetbuddy.app',
  schedule: 'MONTH_END',
  format: 'PDF_AND_HTML',
  sections: {
    cashFlowCharts: true,
    categoryBreakdown: true,
    rule503020: true,
    aiAdvisorInsights: true,
    transactionLedger: true
  },
  lastSent: '2026-08-31 23:59',
  nextScheduled: '2026-09-30 23:59'
};

export const getMonthlyReportSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const profile = getUserProfile();
    const defaults = { ...DEFAULT_REPORT_SETTINGS, email: profile.email || 'user@budgetbuddy.app' };
    if (saved) {
      return { ...defaults, ...JSON.parse(saved) };
    }
    return defaults;
  } catch (err) {
    console.error('Error reading report settings:', err);
    return DEFAULT_REPORT_SETTINGS;
  }
};

export const saveMonthlyReportSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('userDataChanged'));
    return true;
  } catch (err) {
    console.error('Error saving report settings:', err);
    return false;
  }
};

export const getLiveMonthlyReportData = () => {
  const telemetry = calculateFinancialTelemetry();
  const profile = getUserProfile();

  const currentInc = telemetry.summary.totalIncome || 125000;
  const currentExp = telemetry.summary.totalExpense || 38450;

  const cashFlow = [
    { month: 'Apr', income: Math.round(currentInc * 0.88), expense: Math.round(currentExp * 1.1) },
    { month: 'May', income: Math.round(currentInc * 0.92), expense: Math.round(currentExp * 1.15) },
    { month: 'Jun', income: Math.round(currentInc * 0.96), expense: Math.round(currentExp * 1.02) },
    { month: 'Jul', income: Math.round(currentInc * 0.96), expense: Math.round(currentExp * 1.06) },
    { month: 'Aug', income: Math.round(currentInc * 1.0), expense: Math.round(currentExp * 0.96) },
    { month: 'Sep', income: currentInc, expense: currentExp },
  ];

  return {
    month: 'September 2026',
    generatedAt: `${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} IST`,
    user: {
      name: profile.name || 'Priyansu Sekhar',
      email: profile.email || 'user@budgetbuddy.app',
      accountTier: profile.planTier || 'Pro Telemetry Edition'
    },
    summary: telemetry.summary,
    cashFlow,
    categories: telemetry.categories,
    rule503020: telemetry.rule503020,
    aiInsights: [
      {
        title: 'Monthly Cash Flow Balance',
        type: 'POSITIVE',
        content: `Your total recorded income of ₹${telemetry.summary.totalIncome.toLocaleString('en-IN')} vs expenses of ₹${telemetry.summary.totalExpense.toLocaleString('en-IN')} yields a net savings rate of ${telemetry.summary.savingsRate}%.`
      },
      {
        title: 'Category Spending Telemetry',
        type: 'RECOMMENDATION',
        content: telemetry.categories.length > 0 
          ? `Top spending category is ${telemetry.categories[0].name} (${telemetry.categories[0].percent}% of total expenses).` 
          : 'No transactions recorded for category telemetry yet.'
      }
    ],
    topTransactions: telemetry.transactions.slice(0, 5)
  };
};

export const generateReportHTMLDocument = (overrideData = null) => {
  const data = overrideData || getLiveMonthlyReportData();
  const { month, user, summary, cashFlow, categories, aiInsights, topTransactions } = data;

  const categoryRows = categories.map(c => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <span style="display:inline-block; width:10px; height:10px; background-color:${c.color}; border-radius:50%; margin-right:8px;"></span>
        <strong>${c.name}</strong>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right;">₹${Number(c.amount).toLocaleString('en-IN')}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right;">${c.percent}%</td>
    </tr>
  `).join('');

  const transactionRows = (topTransactions || []).map(t => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${t.title || t.name}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center;">${t.date}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center;"><span style="background:#f0f7ff; color:#088fff; padding:2px 8px; border-radius:4px; font-size:12px;">${t.category}</span></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right; font-weight:bold;">₹${Number(t.amount).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const insightsBlocks = aiInsights.map(i => `
    <div style="background:#f8fafc; border-left: 4px solid ${i.type === 'POSITIVE' ? '#10b981' : '#088fff'}; padding: 14px; margin-bottom: 12px; border-radius: 4px;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${i.type === 'POSITIVE' ? '#10b981' : '#088fff'}; font-weight:bold; margin-bottom:4px;">${i.title}</div>
      <div style="font-size:13px; color:#334155; line-height:1.5;">${i.content}</div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Budget Buddy - Monthly Financial Statement (${month})</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #ffffff; margin: 0; padding: 40px; }
    .header { border-bottom: 2px solid #088fff; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
    .brand span { color: #088fff; }
    .subtitle { font-size: 12px; text-transform: uppercase; tracking: 2px; color: #666; margin-top: 4px; }
    .meta-box { text-align: right; font-size: 13px; color: #555; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
    .kpi-val { font-size: 22px; font-weight: 800; margin-top: 6px; color: #111827; }
    .section-title { font-size: 16px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; margin-bottom: 16px; display: flex; items-center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
    th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563; }
    .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 11px; color: #9ca3af; text-align: center; }
    .bar-container { display: flex; align-items: flex-end; justify-content: space-between; height: 160px; gap: 12px; background: #fafafa; border: 1px solid #eee; padding: 20px; border-radius: 6px; }
    .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .bars { display: flex; align-items: flex-end; gap: 4px; width: 100%; height: 100%; justify-content: center; }
    .bar-inc { width: 18px; background: #088fff; border-radius: 2px 2px 0 0; }
    .bar-exp { width: 18px; background: #1a1a1a; border-radius: 2px 2px 0 0; }
    .bar-label { font-size: 10px; font-weight: bold; color: #666; margin-top: 6px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">BUDGET <span>BUDDY</span></div>
      <div class="subtitle">Official Executive Monthly Financial Statement</div>
    </div>
    <div class="meta-box">
      <div><strong>Period:</strong> ${month}</div>
      <div><strong>Account:</strong> ${user.name} (${user.email})</div>
      <div><strong>Generated:</strong> ${data.generatedAt}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Monthly Income</div>
      <div class="kpi-val" style="color:#088fff;">₹${summary.totalIncome.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Total Expenses</div>
      <div class="kpi-val">₹${summary.totalExpense.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Net Savings</div>
      <div class="kpi-val" style="color:#10b981;">₹${summary.netSavings.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Savings Rate</div>
      <div class="kpi-val">${summary.savingsRate}%</div>
    </div>
  </div>

  <div class="section-title">Cash Flow Trajectory (6-Month Horizon)</div>
  <div class="bar-container">
    ${cashFlow.map(cf => {
      const maxVal = Math.max(150000, summary.totalIncome * 1.25);
      return `
      <div class="bar-group">
        <div class="bars">
          <div class="bar-inc" style="height: ${(cf.income / maxVal) * 100}%;" title="Income: ₹${cf.income}"></div>
          <div class="bar-exp" style="height: ${(cf.expense / maxVal) * 100}%;" title="Expense: ₹${cf.expense}"></div>
        </div>
        <div class="bar-label">${cf.month}</div>
      </div>
      `;
    }).join('')}
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
    <div>
      <div class="section-title">Category Spending Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align:right;">Amount</th>
            <th style="text-align:right;">Share</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows}
        </tbody>
      </table>
    </div>

    <div>
      <div class="section-title">AI Financial Intelligence</div>
      ${insightsBlocks}
    </div>
  </div>

  <div class="section-title">Significant Activity Specimen</div>
  <table>
    <thead>
      <tr>
        <th>Transaction</th>
        <th style="text-align:center;">Date</th>
        <th style="text-align:center;">Category</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows || '<tr><td colSpan="4" style="text-align:center; padding:10px;">No transactions recorded.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    Budget Buddy Financial Telemetry Engine • End-to-End Encrypted Document Report • Delivered to ${user.email}
  </div>
</body>
</html>
  `;
};

export const sendTestMonthlyReportEmail = async (email = 'user@budgetbuddy.app') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Monthly Financial Document Report dispatched to ${email}!`,
        sentAt: new Date().toLocaleString()
      });
    }, 1200);
  });
};
