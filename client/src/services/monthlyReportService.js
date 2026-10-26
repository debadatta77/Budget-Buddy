// Service for Monthly Email Report Settings & Dynamic Document Generation
import { getUserProfile, calculateFinancialTelemetry } from './userDataService';
import { reportAPI, TOKEN_STORAGE_KEY } from './apiClient';
import { formatCurrency } from '../utils/formatCurrency';

const STORAGE_KEY = 'budget_buddy_monthly_report_settings';

export const getNextScheduledDate = (schedule = 'MONTH_END') => {
  const now = new Date();
  
  if (schedule === 'FIRST_OF_MONTH') {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yyyy = nextMonth.getFullYear();
    const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}-01 08:00`;
  }
  
  if (schedule === 'BI_WEEKLY') {
    if (now.getDate() < 15) {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}-15 08:00`;
    } else {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const yyyy = nextMonth.getFullYear();
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}-01 08:00`;
    }
  }

  // Default: MONTH_END (Last day of current month at 23:59)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const yyyy = lastDay.getFullYear();
  const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
  const dd = String(lastDay.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} 23:59`;
};

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
  nextScheduled: getNextScheduledDate('MONTH_END')
};

export const getMonthlyReportSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const profile = getUserProfile();
    const defaults = { 
      ...DEFAULT_REPORT_SETTINGS, 
      email: profile.email || 'user@budgetbuddy.app'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.format === 'HTML_ONLY') parsed.format = 'PDF_AND_HTML';
      return { 
        ...defaults, 
        ...parsed,
        nextScheduled: getNextScheduledDate(parsed.schedule || defaults.schedule)
      };
    }
    return { ...defaults, nextScheduled: getNextScheduledDate(defaults.schedule) };
  } catch (err) {
    console.error('Error reading report settings:', err);
    return DEFAULT_REPORT_SETTINGS;
  }
};

export const saveMonthlyReportSettings = (settings) => {
  try {
    const updated = {
      ...settings,
      nextScheduled: getNextScheduledDate(settings.schedule)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('userDataChanged'));

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    reportAPI.updateSettings(updated).catch(err => {
      console.warn('Backend report settings update failed:', err);
    });

    return true;
  } catch (err) {
    console.error('Error saving report settings:', err);
    return false;
  }
};

export const getLiveMonthlyReportData = (targetMonthKey = null) => {
  const telemetry = calculateFinancialTelemetry();
  const profile = getUserProfile();
  const now = new Date();

  const currentInc = Number(telemetry.summary.totalIncome) || 0;
  const currentExp = Number(telemetry.summary.totalExpense) || 0;

  // Compute month label dynamically
  const displayMonth = targetMonthKey 
    ? new Date(`${targetMonthKey}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Compute real cashflow from transactions
  const txs = telemetry.transactions || [];
  const monthMap = {};
  txs.forEach(t => {
    if (!t.date) return;
    const key = String(t.date).slice(0, 7); // 'YYYY-MM'
    if (!monthMap[key]) {
      monthMap[key] = { income: 0, expense: 0 };
    }
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') monthMap[key].income += amt;
    else monthMap[key].expense += amt;
  });

  const sortedKeys = Object.keys(monthMap).sort();
  let cashFlow = [];
  if (sortedKeys.length === 0) {
    const shortLabel = now.toLocaleDateString('en-US', { month: 'short' });
    cashFlow = [{ month: shortLabel, income: currentInc, expense: currentExp }];
  } else {
    cashFlow = sortedKeys.slice(-6).map(key => {
      const d = new Date(`${key}-01`);
      const label = isNaN(d.getTime()) ? key : d.toLocaleDateString('en-US', { month: 'short' });
      return {
        month: label,
        income: Math.round(monthMap[key].income),
        expense: Math.round(monthMap[key].expense)
      };
    });
  }

  return {
    month: displayMonth,
    generatedAt: `${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} IST`,
    user: {
      name: profile.name || 'Member Account',
      email: profile.email || '',
      accountTier: profile.planTier || 'Pro Edition'
    },
    summary: telemetry.summary,
    cashFlow,
    categories: telemetry.categories,
    rule503020: telemetry.rule503020,
    aiInsights: [
      {
        title: 'Monthly Cash Flow Balance',
        type: 'POSITIVE',
        content: `Your total recorded income of ${formatCurrency(telemetry.summary.totalIncome)} vs expenses of ${formatCurrency(telemetry.summary.totalExpense)} yields a net savings rate of ${telemetry.summary.savingsRate}%.`
      },
      {
        title: 'Category Spending Breakdown',
        type: 'RECOMMENDATION',
        content: telemetry.categories.length > 0 
          ? `Top spending category is ${telemetry.categories[0].name} (${telemetry.categories[0].percent}% of total expenses).` 
          : 'No transactions recorded for category insights yet.'
      }
    ],
    topTransactions: telemetry.transactions.slice(0, 5)
  };
};

// Export actual live transactions into a real CSV file
export const exportTransactionsToCSV = () => {
  const telemetry = calculateFinancialTelemetry();
  const txs = telemetry.transactions || [];

  if (txs.length === 0) {
    alert('No transactions recorded to export.');
    return { success: false, count: 0 };
  }

  const headers = ['Transaction ID', 'Date', 'Description', 'Category', 'Type', 'Amount (INR)'];
  const rows = txs.map(t => [
    `"${t.id || ''}"`,
    `"${t.date || ''}"`,
    `"${(t.title || t.name || '').replace(/"/g, '""')}"`,
    `"${t.category || 'Other'}"`,
    `"${t.type || 'expense'}"`,
    Number(t.amount) || 0
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  a.href = url;
  a.download = `BudgetBuddy_Transactions_Ledger_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, count: txs.length };
};

export const generateReportHTMLDocument = (overrideData = null, overrideSections = null) => {
  const data = overrideData || getLiveMonthlyReportData();
  const settings = getMonthlyReportSettings();
  const sections = overrideSections || settings?.sections || {
    cashFlowCharts: true,
    categoryBreakdown: true,
    rule503020: true,
    aiAdvisorInsights: true,
    transactionLedger: true
  };
  const { month, user, summary, cashFlow, categories, aiInsights, topTransactions, rule503020 } = data;

  const categoryRows = categories.map(c => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <span style="display:inline-block; width:10px; height:10px; background-color:${c.color}; border-radius:50%; margin-right:8px;"></span>
        <strong>${c.name}</strong>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right;">${formatCurrency(Number(c.amount))}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right;">${c.percent}%</td>
    </tr>
  `).join('');

  const transactionRows = (topTransactions || []).map(t => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${t.title || t.name}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center;">${t.date}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center;"><span style="background:#f0f7ff; color:#088fff; padding:2px 8px; border-radius:4px; font-size:12px;">${t.category}</span></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right; font-weight:bold;">${formatCurrency(Number(t.amount))}</td>
    </tr>
  `).join('');

  const insightsBlocks = aiInsights.map(i => `
    <div style="background:#f8fafc; border-left: 4px solid ${i.type === 'POSITIVE' ? '#10b981' : '#088fff'}; padding: 14px; margin-bottom: 12px; border-radius: 4px;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${i.type === 'POSITIVE' ? '#10b981' : '#088fff'}; font-weight:bold; margin-bottom:4px;">${i.title}</div>
      <div style="font-size:13px; color:#334155; line-height:1.5;">${i.content}</div>
    </div>
  `).join('');

  const cashFlowHtml = sections.cashFlowCharts !== false ? `
    <div class="section-title">Cash Flow Trajectory (6-Month Horizon)</div>
    <div class="bar-container">
      ${cashFlow.map(cf => {
        const maxVal = Math.max(150000, summary.totalIncome * 1.25);
        return `
        <div class="bar-group">
          <div class="bars">
            <div class="bar-inc" style="height: ${(cf.income / maxVal) * 100}%;" title="Income: ${formatCurrency(cf.income)}"></div>
            <div class="bar-exp" style="height: ${(cf.expense / maxVal) * 100}%;" title="Expense: ${formatCurrency(cf.expense)}"></div>
          </div>
          <div class="bar-label">${cf.month}</div>
        </div>
        `;
      }).join('')}
    </div>
  ` : '';

  const showCategories = sections.categoryBreakdown !== false;
  const showAI = sections.aiAdvisorInsights !== false;

  let middleSectionHtml = '';
  if (showCategories && showAI) {
    middleSectionHtml = `
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
              ${categoryRows || '<tr><td colspan="3" style="text-align:center; padding:10px;">No categories recorded.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div>
          <div class="section-title">AI Financial Insights</div>
          ${insightsBlocks}
        </div>
      </div>
    `;
  } else if (showCategories) {
    middleSectionHtml = `
      <div style="margin-top: 20px;">
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
            ${categoryRows || '<tr><td colspan="3" style="text-align:center; padding:10px;">No categories recorded.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } else if (showAI) {
    middleSectionHtml = `
      <div style="margin-top: 20px;">
        <div class="section-title">AI Financial Insights</div>
        ${insightsBlocks}
      </div>
    `;
  }

  const r5020 = rule503020 || { needs: { target: 50, actual: 50 }, wants: { target: 30, actual: 30 }, savings: { target: 20, actual: 20 } };
  const rule503020Html = sections.rule503020 !== false ? `
    <div style="margin-top: 25px;">
      <div class="section-title">50/30/20 Budget Rule Breakdown</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px;">
          <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Needs (Target 50%)</div>
          <div style="font-size:18px; font-weight:bold; color:#088fff; margin-top:4px;">${r5020.needs?.actual || 0}%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Essential living costs</div>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px;">
          <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Wants (Target 30%)</div>
          <div style="font-size:18px; font-weight:bold; color:#f59e0b; margin-top:4px;">${r5020.wants?.actual || 0}%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Discretionary lifestyle</div>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px;">
          <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Savings (Target 20%)</div>
          <div style="font-size:18px; font-weight:bold; color:#10b981; margin-top:4px;">${r5020.savings?.actual || 0}%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Investments & reserves</div>
        </div>
      </div>
    </div>
  ` : '';

  const transactionsHtml = sections.transactionLedger !== false ? `
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
  ` : '';

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
      <div class="kpi-val" style="color:#088fff;">${formatCurrency(summary.totalIncome)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Total Expenses</div>
      <div class="kpi-val">${formatCurrency(summary.totalExpense)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Net Savings</div>
      <div class="kpi-val" style="color:#10b981;">${formatCurrency(summary.netSavings)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Savings Rate</div>
      <div class="kpi-val">${summary.savingsRate}%</div>
    </div>
  </div>

  ${cashFlowHtml}
  ${middleSectionHtml}
  ${rule503020Html}
  ${transactionsHtml}

  <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
    <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Budget Buddy • Personal Wealth & Expense Management</p>
    <p style="margin: 0 0 6px 0;">You received this automated statement because you requested monthly financial updates for <strong>${user.email}</strong>.</p>
    <p style="margin: 0; color: #94a3b8;">To adjust your delivery schedule or report preferences, visit the Reports tab inside Budget Buddy.</p>
  </div>
</body>
</html>
  `;
};

export const sendTestMonthlyReportEmail = async (email = 'user@budgetbuddy.app') => {
  try {
    const settings = getMonthlyReportSettings();
    const reportData = getLiveMonthlyReportData();
    const html = generateReportHTMLDocument(reportData, settings?.sections);
    const res = await reportAPI.sendNow({
      email,
      html,
      periodName: reportData.month,
      format: settings?.format || 'PDF_AND_HTML',
      sections: settings?.sections || {},
      transactions: reportData.topTransactions || [],
      summary: reportData.summary || {},
      categories: reportData.categories || [],
      cashFlow: reportData.cashFlow || []
    });

    if (res?.success) {
      return {
        success: true,
        message: `${res.message || `Monthly Financial Document Report dispatched to ${email}!`} (Note: If this is your first time receiving, please check Spam/Updates and click "Not Spam" to whitelist).`,
        previewUrl: res.previewUrl || null,
        simulated: res.simulated || false,
        sentAt: new Date().toLocaleString()
      };
    }
    return {
      success: false,
      message: res?.message || 'Failed to dispatch statement via email server.',
      sentAt: new Date().toLocaleString()
    };
  } catch (err) {
    console.warn('Backend report dispatch error:', err);
    return {
      success: false,
      message: err?.message || err?.error || 'Email dispatch failed. Please check server SMTP configuration.',
      sentAt: new Date().toLocaleString()
    };
  }
};
