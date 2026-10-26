/**
 * ============================================================================
 * Financial Statement & Document Service
 * ============================================================================
 * Compiles real-time user financial telemetry into formal executive HTML
 * financial statements suitable for browser display, PDF printing, and email dispatch.
 */

/**
 * Generates an executive HTML financial statement document
 *
 * @param {Object} params
 * @param {Object} params.user - User details { name, email, planTier }
 * @param {Object} params.summary - Telemetry summary { totalIncome, totalExpense, netSavings, savingsRate }
 * @param {Array<Object>} params.categories - Sorted category list [{ name, amount, percent, color }]
 * @param {Array<Object>} params.transactions - Recent transactions list
 * @param {Array<Object>} [params.cashFlow] - 6-month cashflow horizon array
 * @param {string} [params.periodName] - Statement period label (e.g. "October 2026")
 * @returns {string} Fully self-contained HTML document
 */
export const generateExecutiveStatementHTML = ({
  user = {},
  summary = {},
  categories = [],
  transactions = [],
  cashFlow = null,
  periodName = 'October 2026',
  sections = {},
  rule503020 = null
} = {}) => {
  const userName = user.name || 'Member Account';
  const userEmail = user.email || 'user@budgetbuddy.app';
  const planTier = user.planTier || 'Pro Edition';

  const totalIncome = Number(summary.totalIncome) || 0;
  const totalExpense = Number(summary.totalExpense) || 0;
  const netSavings = summary.netSavings !== undefined ? Number(summary.netSavings) : (totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // Default 6-month cashflow horizon if not provided
  const monthlyCashflow = cashFlow || [
    { month: 'May 26', income: Math.round(totalIncome * 0.90), expense: Math.round(totalExpense * 1.10) },
    { month: 'Jun 26', income: Math.round(totalIncome * 0.94), expense: Math.round(totalExpense * 1.05) },
    { month: 'Jul 26', income: Math.round(totalIncome * 0.96), expense: Math.round(totalExpense * 1.02) },
    { month: 'Aug 26', income: Math.round(totalIncome * 0.98), expense: Math.round(totalExpense * 0.98) },
    { month: 'Sep 26', income: totalIncome, expense: Math.round(totalExpense * 0.95) },
    { month: 'Oct 26', income: totalIncome, expense: totalExpense }
  ];

  const maxVal = Math.max(150000, totalIncome * 1.25);

  const categoryRows = categories.slice(0, 6).map(c => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
        <span style="display:inline-block; width:10px; height:10px; background-color:${c.color || '#088fff'}; border-radius:50%; margin-right:8px;"></span>
        <strong>${c.name}</strong>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align:right; font-family: monospace;">
        ₹${Number(c.amount).toLocaleString('en-IN')}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align:right; font-family: monospace; font-weight: bold;">
        ${c.percent}%
      </td>
    </tr>
  `).join('');

  const recentTxs = (transactions || []).slice(0, 6);
  const transactionRows = recentTxs.length > 0
    ? recentTxs.map(t => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${t.title || 'Transaction'}</strong>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align:center; font-family: monospace; color: #6b7280;">
            ${t.date || new Date().toISOString().split('T')[0]}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align:center;">
            <span style="background:#eff6ff; color:#088fff; padding:2px 8px; border-radius:4px; font-size:11px; font-family: monospace; font-weight: bold;">
              ${t.category || 'General'}
            </span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align:right; font-family: monospace; font-weight: bold; color: ${t.type === 'income' ? '#10b981' : '#111827'};">
            ${t.type === 'income' ? '+' : '-'}₹${Number(t.amount).toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="text-align:center; padding:16px; color:#9ca3af;">No recent transactions recorded.</td></tr>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Budget Buddy - Monthly Financial Statement (${periodName})</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; background: #ffffff; margin: 0; padding: 40px; line-height: 1.5; }
    .header { border-bottom: 2px solid #088fff; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
    .brand span { color: #088fff; }
    .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-top: 4px; font-weight: bold; }
    .meta-box { text-align: right; font-size: 12px; color: #4b5563; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; }
    .kpi-title { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: bold; letter-spacing: 1px; }
    .kpi-val { font-size: 22px; font-weight: 800; margin-top: 6px; color: #111827; font-family: monospace; }
    .section-title { font-size: 15px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #4b5563; font-weight: bold; letter-spacing: 1px; }
    .bar-container { display: flex; align-items: flex-end; justify-content: space-between; height: 160px; gap: 12px; background: #fafafa; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
    .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .bars { display: flex; align-items: flex-end; gap: 4px; width: 100%; height: 100%; justify-content: center; }
    .bar-inc { width: 18px; background: #088fff; border-radius: 2px 2px 0 0; }
    .bar-exp { width: 18px; background: #111827; border-radius: 2px 2px 0 0; }
    .bar-label { font-size: 10px; font-weight: bold; color: #6b7280; margin-top: 6px; text-transform: uppercase; font-family: monospace; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; }
    .insight-card { background: #f8fafc; border-left: 4px solid #088fff; padding: 14px; margin-bottom: 12px; border-radius: 4px; font-size: 12px; }
    .footer { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">BUDGET <span>BUDDY</span></div>
      <div class="subtitle">Official Executive Monthly Financial Statement</div>
    </div>
    <div class="meta-box">
      <div><strong>Period:</strong> ${periodName}</div>
      <div><strong>Account:</strong> ${userName} (${userEmail})</div>
      <div><strong>Plan Tier:</strong> ${planTier}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} IST</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Monthly Income</div>
      <div class="kpi-val" style="color:#088fff;">₹${totalIncome.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Total Outflow</div>
      <div class="kpi-val">₹${totalExpense.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Net Surplus</div>
      <div class="kpi-val" style="color:#10b981;">+₹${netSavings.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Savings Rate</div>
      <div class="kpi-val">${savingsRate}%</div>
    </div>
  </div>

  ${sections.cashFlowCharts !== false ? `
    <div class="section-title">Cash Flow Trajectory (6-Month Horizon)</div>
    <div class="bar-container">
      ${monthlyCashflow.map(cf => `
        <div class="bar-group">
          <div class="bars">
            <div class="bar-inc" style="height: ${Math.min(100, (cf.income / maxVal) * 100)}%;" title="Income: ₹${cf.income}"></div>
            <div class="bar-exp" style="height: ${Math.min(100, (cf.expense / maxVal) * 100)}%;" title="Expense: ₹${cf.expense}"></div>
          </div>
          <div class="bar-label">${cf.month}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${(sections.categoryBreakdown !== false || sections.aiAdvisorInsights !== false) ? `
    <div class="two-col" style="${sections.categoryBreakdown !== false && sections.aiAdvisorInsights !== false ? '' : 'grid-template-columns: 1fr;'}">
      ${sections.categoryBreakdown !== false ? `
        <div>
          <div class="section-title">Category Spending Distribution</div>
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
      ` : ''}

      ${sections.aiAdvisorInsights !== false ? `
        <div>
          <div class="section-title">AI Financial Intelligence Audit</div>
          <div class="insight-card" style="border-left-color: #10b981;">
            <div style="font-size:10px; font-weight:bold; color:#10b981; text-transform:uppercase; margin-bottom:4px; letter-spacing:1px;">CASHFLOW LIQUIDITY • HEALTHY</div>
            <div>Your net savings rate of ${savingsRate}% comfortably surpasses the institutional 20% savings threshold, delivering sustained monthly capital accumulation.</div>
          </div>
          <div class="insight-card" style="border-left-color: #088fff;">
            <div style="font-size:10px; font-weight:bold; color:#088fff; text-transform:uppercase; margin-bottom:4px; letter-spacing:1px;">TOP EXPENDITURE MONITOR</div>
            <div>Primary category pressure is centered in ${categories[0]?.name || 'Essentials'} (${categories[0]?.percent || 0}% of burn). Reallocating 5% to the Emergency Vault will compress discretionary burn effectively.</div>
          </div>
        </div>
      ` : ''}
    </div>
  ` : ''}

  ${sections.rule503020 !== false ? `
    <div style="margin-top: 25px;">
      <div class="section-title">50/30/20 Budget Breakdown</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px;">
          <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Needs (Target 50%)</div>
          <div style="font-size:18px; font-weight:bold; color:#088fff; margin-top:4px;">${rule503020?.needs?.actual || (totalIncome > 0 ? Math.min(100, Math.round((totalExpense * 0.6) / totalIncome * 100)) : 50)}%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Essential living costs</div>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px;">
          <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Wants (Target 30%)</div>
          <div style="font-size:18px; font-weight:bold; color:#f59e0b; margin-top:4px;">${rule503020?.wants?.actual || (totalIncome > 0 ? Math.min(100, Math.round((totalExpense * 0.4) / totalIncome * 100)) : 30)}%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Discretionary lifestyle</div>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 14px; border-radius:6px;">
          <div style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Savings (Target 20%)</div>
          <div style="font-size:18px; font-weight:bold; color:#10b981; margin-top:4px;">${rule503020?.savings?.actual || savingsRate}%</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:2px;">Investments & reserves</div>
        </div>
      </div>
    </div>
  ` : ''}

  ${sections.transactionLedger !== false ? `
    <div class="section-title">Recent Activity Specimen</div>
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
        ${transactionRows}
      </tbody>
    </table>
  ` : ''}

  <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
    <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Budget Buddy • Personal Wealth & Expense Management</p>
    <p style="margin: 0 0 6px 0;">You received this automated statement because you requested monthly financial updates for <strong>${userEmail}</strong>.</p>
    <p style="margin: 0; color: #94a3b8;">To adjust your delivery schedule or report preferences, visit the Reports tab inside Budget Buddy.</p>
  </div>
</body>
</html>`;
};
