import cron from 'node-cron';
import nodemailer from 'nodemailer';
import ReportSettings from '../models/ReportSettings.js';
import User from '../models/User.js';
import Budget from '../models/Budget.js';
import Vault from '../models/Vault.js';
import Transaction from '../models/Transaction.js';
import { generateFullTelemetry } from './telemetryService.js';
import { generateExecutiveStatementHTML } from './statementService.js';
import { generateExecutiveStatementPDF } from './pdfService.js';

/**
 * ============================================================================
 * Automated Monthly Financial Statement Scheduler
 * ============================================================================
 * Dispatches monthly financial telemetry statements on schedule:
 * - 1st of every month at 08:00 AM (dispatches preceding month statement, e.g. Oct statement on Nov 1st)
 * - Month-End last day at 23:59 PM (dispatches concluding month statement)
 * - Bi-Weekly on 1st & 15th
 */

/**
 * Builds reusable Nodemailer transporter from environment credentials
 */
const getMailTransporter = () => {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const emailService = process.env.EMAIL_SERVICE;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;

  if (!emailUser || !emailPass) {
    return null;
  }

  const transportConfig = emailService === 'gmail' || smtpHost === 'smtp.gmail.com' || (!smtpHost && emailUser.endsWith('@gmail.com'))
    ? {
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass }
      }
    : {
        host: smtpHost || 'smtp.gmail.com',
        port: Number(smtpPort) || 587,
        secure: Number(smtpPort) === 465,
        auth: { user: emailUser, pass: emailPass }
      };

  return nodemailer.createTransport(transportConfig);
};

/**
 * Dispatches statement for a single subscribed user
 */
export const dispatchStatementForUser = async (userId, targetPeriodName = null) => {
  try {
    const [user, budget, vault, settings] = await Promise.all([
      User.findById(userId).select('-password'),
      Budget.findOne({ userId }),
      Vault.findOne({ userId }),
      ReportSettings.findOne({ userId })
    ]);

    if (!user) return { success: false, reason: 'User not found' };
    const recipientEmail = (settings?.email || user.email || '').trim().toLowerCase();
    if (!recipientEmail) return { success: false, reason: 'No recipient email configured' };

    // Determine target statement period (default: previous calendar month if on 1st, or current month)
    const now = new Date();
    let periodLabel = targetPeriodName;
    let startDate, endDate;

    if (!periodLabel) {
      if (now.getDate() === 1) {
        // Dispatched on 1st of month: report on the month that just closed (e.g. October statement on Nov 1)
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodLabel = prevMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
    }

    // Query transactions for the period, falling back to recent if none in date range
    let periodTransactions = [];
    if (startDate && endDate) {
      periodTransactions = await Transaction.find({
        userId,
        date: { $gte: startDate, $lt: endDate }
      }).sort({ date: -1 });
    }

    if (periodTransactions.length === 0) {
      periodTransactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(15);
    }

    // Compile telemetry & generate executive HTML document
    const telemetry = generateFullTelemetry({
      profile: user || {},
      transactions: periodTransactions.map(t => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date?.toISOString().split('T')[0] || ''
      })),
      vault: vault || { current: 0, target: 100000 },
      budget: budget || { monthlyIncome: 0, categories: [] }
    });

    const sections = settings?.sections ? (typeof settings.sections.toObject === 'function' ? settings.sections.toObject() : settings.sections) : {};

    const htmlStatement = generateExecutiveStatementHTML({
      user: {
        name: user.name,
        email: user.email,
        planTier: user.planTier || 'Pro Edition'
      },
      summary: telemetry.summary,
      categories: telemetry.categories,
      transactions: telemetry.transactions,
      periodName: periodLabel,
      sections,
      rule503020: telemetry.rule503020
    });

    let format = (settings?.format || 'PDF_AND_HTML').toUpperCase();
    if (format === 'HTML_ONLY') format = 'PDF_AND_HTML';
    const safePeriod = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    const attachments = [];

    // 1. Generate PDF attachment if format is PDF_AND_HTML or PDF_ONLY
    if (format === 'PDF_AND_HTML' || format === 'PDF_ONLY') {
      try {
        const pdfBuffer = await generateExecutiveStatementPDF({
          periodName: periodLabel,
          user,
          summary: telemetry.summary,
          categories: telemetry.categories,
          transactions: telemetry.transactions,
          sections,
          rule503020: telemetry.rule503020
        });

        attachments.push({
          filename: `BudgetBuddy_Statement_${safePeriod}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      } catch (pdfErr) {
        console.warn('[Auto-Reporter] PDF generation warning:', pdfErr.message);
      }
    }

    // 2. Generate CSV attachment if format is CSV
    if (format === 'CSV') {
      const csvHeaders = 'Transaction ID,Date,Description,Category,Type,Amount (INR)\n';
      const csvRows = (telemetry.transactions || []).map(t => `"${t.id || ''}","${t.date || ''}","${(t.title || 'Transaction').replace(/"/g, '""')}","${t.category || 'General'}","${t.type || 'expense'}",${Number(t.amount) || 0}`).join('\n');
      const csvContent = csvHeaders + csvRows;

      attachments.push({
        filename: `BudgetBuddy_Transactions_${safePeriod}.csv`,
        content: csvContent,
        contentType: 'text/csv'
      });
    }

    let emailHtml = htmlStatement;
    let emailText = `Hello ${user.name || ''},\n\nHere is your official Budget Buddy Monthly Financial Statement for ${periodLabel}.\n\nThis statement was automatically generated and dispatched securely according to your delivery schedule preference.\n\nBest regards,\nBudget Buddy Financial Team`;
    let emailSubject = format === 'CSV' ? `Transaction Ledger Export - ${periodLabel}` : `Monthly Financial Statement - ${periodLabel}`;

    if (format === 'PDF_ONLY') {
      emailHtml = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif; max-width:600px; margin:auto; padding:32px; border:1px solid #e2e8f0; border-radius:8px; color:#1e293b; background:#ffffff;">
          <h2 style="color:#088fff; margin-top:0;">Budget Buddy • Financial Statement</h2>
          <p>Hello <strong>${user.name || 'Member'}</strong>,</p>
          <p>Your official executive financial statement for <strong>${periodLabel}</strong> has been generated and is attached to this email as a PDF document.</p>
          <div style="background:#f8fafc; border-left:4px solid #088fff; padding:12px 16px; margin:20px 0; border-radius:4px; font-size:13px;">
            Attachment: <strong>BudgetBuddy_Statement_${safePeriod}.pdf</strong>
          </div>
          <p style="font-size:11px; color:#64748b; margin-top:30px; border-top:1px solid #f1f5f9; padding-top:16px;">
            You are receiving this because you selected <em>PDF Attachment Only</em> in your Budget Buddy report settings.
          </p>
        </div>
      `;
    } else if (format === 'CSV') {
      emailHtml = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif; max-width:600px; margin:auto; padding:32px; border:1px solid #e2e8f0; border-radius:8px; color:#1e293b; background:#ffffff;">
          <h2 style="color:#088fff; margin-top:0;">Budget Buddy • Transaction Ledger Export</h2>
          <p>Hello <strong>${user.name || 'Member'}</strong>,</p>
          <p>Your complete transaction ledger data export for <strong>${periodLabel}</strong> has been generated and is attached to this email as a CSV spreadsheet.</p>
          <div style="background:#f8fafc; border-left:4px solid #10b981; padding:12px 16px; margin:20px 0; border-radius:4px; font-size:13px;">
            Attachment: <strong>BudgetBuddy_Transactions_${safePeriod}.csv</strong>
          </div>
          <p style="font-size:12px; color:#475569;">You can open this CSV file in Microsoft Excel, Google Sheets, or Apple Numbers.</p>
        </div>
      `;
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      console.warn(`[Auto-Reporter] Skipped dispatch to ${recipientEmail}: SMTP credentials not configured in .env`);
      return { success: false, reason: 'SMTP not configured' };
    }

    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: {
        name: 'Budget Buddy',
        address: emailUser
      },
      to: recipientEmail,
      replyTo: emailUser,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments
    });

    // Update lastSent in settings
    if (settings) {
      settings.lastSent = new Date();
      await settings.save();
    }

    console.log(`[Auto-Reporter] ✓ Dispatched ${periodLabel} statement to ${recipientEmail} (MsgID: ${info.messageId})`);
    return { success: true, recipient: recipientEmail, messageId: info.messageId, period: periodLabel };
  } catch (err) {
    console.error(`[Auto-Reporter] ✗ Failed dispatch for userId ${userId}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Checks all active subscriptions and dispatches matching schedules
 */
export const processScheduledReports = async (forced = false) => {
  try {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const isFirstOfMonth = dayOfMonth === 1;
    const isMidMonth = dayOfMonth === 15;
    const isLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === dayOfMonth;

    console.log(`[Auto-Reporter] Checking subscriptions (Day ${dayOfMonth}, FirstOfMonth: ${isFirstOfMonth}, LastDay: ${isLastDay}, Forced: ${forced})`);

    const activeSettings = await ReportSettings.find({ enabled: true });
    if (activeSettings.length === 0) {
      console.log('[Auto-Reporter] No active report subscriptions found in database.');
      return { processed: 0, dispatched: 0 };
    }

    let dispatchedCount = 0;
    for (const setting of activeSettings) {
      const schedule = setting.schedule || 'MONTH_END';
      let shouldSend = forced;

      if (!shouldSend) {
        if (schedule === 'FIRST_OF_MONTH' && isFirstOfMonth) shouldSend = true;
        else if (schedule === 'MONTH_END' && (isLastDay || isFirstOfMonth)) shouldSend = true;
        else if (schedule === 'BI_WEEKLY' && (isFirstOfMonth || isMidMonth)) shouldSend = true;
      }

      if (shouldSend) {
        const result = await dispatchStatementForUser(setting.userId);
        if (result.success) dispatchedCount++;
      }
    }

    console.log(`[Auto-Reporter] Completed run: ${dispatchedCount} of ${activeSettings.length} statements dispatched.`);
    return { processed: activeSettings.length, dispatched: dispatchedCount };
  } catch (err) {
    console.error('[Auto-Reporter] Error running scheduled report processor:', err);
    return { error: err.message };
  }
};

/**
 * Initializes Cron Jobs for Automated Dispatches
 */
export const initReportScheduler = () => {
  // 1. First of every month at 08:00 AM ('0 8 1 * *')
  // Automatically dispatches preceding month statement (e.g. Oct statement on Nov 1st)
  cron.schedule('0 8 1 * *', async () => {
    console.log('[Auto-Reporter Cron] Triggering 1st-of-month scheduled dispatches at 08:00 AM...');
    await processScheduledReports(false);
  });

  // 2. Month-end night check at 23:59 PM on days 28-31 ('59 23 28-31 * *')
  // Dispatches to users with MONTH_END schedule on the last day of the month
  cron.schedule('59 23 28-31 * *', async () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (today.getDate() === lastDay) {
      console.log('[Auto-Reporter Cron] Triggering Month-End closing dispatches at 23:59 PM...');
      await processScheduledReports(false);
    }
  });

  // 3. Bi-weekly mid-month check on 15th at 08:00 AM ('0 8 15 * *')
  cron.schedule('0 8 15 * *', async () => {
    console.log('[Auto-Reporter Cron] Triggering Bi-Weekly mid-month dispatches on 15th at 08:00 AM...');
    await processScheduledReports(false);
  });

  console.log('⏰ Automated Report Scheduler registered: Active for 1st of Month (08:00 AM), Month-End (23:59 PM), and Bi-Weekly (15th)');
};
