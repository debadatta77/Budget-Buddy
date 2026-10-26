import nodemailer from 'nodemailer';
import ReportSettings from '../models/ReportSettings.js';
import User from '../models/User.js';
import Budget from '../models/Budget.js';
import Vault from '../models/Vault.js';
import Transaction from '../models/Transaction.js';
import { generateFullTelemetry } from '../services/telemetryService.js';
import { generateExecutiveStatementHTML } from '../services/statementService.js';
import { generateExecutiveStatementPDF } from '../services/pdfService.js';

/**
 * ============================================================================
 * Financial Report & Statement Controller
 * ============================================================================
 * Manages automated dispatch settings, HTML statement previews, and email distribution.
 */

/**
 * Get user report dispatch settings
 * GET /api/v1/reports/settings
 */
export const getReportSettings = async (req, res) => {
  try {
    let settings = await ReportSettings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = await ReportSettings.create({
        userId: req.user.id,
        email: req.user.email
      });
    }

    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error fetching report settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report settings',
      error: err.message
    });
  }
};

/**
 * Update user report dispatch settings
 * PUT /api/v1/reports/settings
 */
export const updateReportSettings = async (req, res) => {
  try {
    const { enabled, email, schedule, format, sections } = req.body;

    let settings = await ReportSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new ReportSettings({ userId: req.user.id, email: req.user.email });
    }

    const getNextScheduledDate = (sched = 'MONTH_END') => {
      const now = new Date();
      if (sched === 'FIRST_OF_MONTH') {
        return new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
      }
      if (sched === 'BI_WEEKLY') {
        if (now.getDate() < 15) {
          return new Date(now.getFullYear(), now.getMonth(), 15, 8, 0, 0);
        } else {
          return new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0);
        }
      }
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    };

    if (enabled !== undefined) settings.enabled = Boolean(enabled);
    if (email) settings.email = email.trim().toLowerCase();
    if (schedule) {
      settings.schedule = schedule;
      settings.nextScheduled = getNextScheduledDate(schedule);
    }
    if (format) settings.format = format;
    if (sections) {
      const existingSections = settings.sections ? (typeof settings.sections.toObject === 'function' ? settings.sections.toObject() : settings.sections) : {};
      settings.sections = {
        ...existingSections,
        ...sections
      };
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Automated statement settings updated successfully',
      data: settings
    });
  } catch (err) {
    console.error('Error updating report settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report settings',
      error: err.message
    });
  }
};

/**
 * Generate live executive HTML statement preview
 * GET /api/v1/reports/preview
 */
export const previewStatement = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, budget, vault, transactions, settings] = await Promise.all([
      User.findById(userId).select('-password'),
      Budget.findOne({ userId }),
      Vault.findOne({ userId }),
      Transaction.find({ userId }).sort({ date: -1 }).limit(10),
      ReportSettings.findOne({ userId })
    ]);

    const telemetry = generateFullTelemetry({
      profile: user || {},
      transactions: transactions.map(t => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date?.toISOString().split('T')[0] || ''
      })),
      vault: vault || { current: 0, target: 100000 },
      budget: budget || { monthlyIncome: 0, categories: [] }
    });

    const now = new Date();
    const periodName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const htmlStatement = generateExecutiveStatementHTML({
      user: {
        name: user.name,
        email: user.email,
        planTier: user.planTier
      },
      summary: telemetry.summary,
      categories: telemetry.categories,
      transactions: telemetry.transactions,
      periodName,
      sections: settings?.sections || {},
      rule503020: telemetry.rule503020
    });

    // Check if client requested raw HTML or JSON payload
    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlStatement);
    }

    return res.status(200).json({
      success: true,
      data: {
        periodName,
        html: htmlStatement
      }
    });
  } catch (err) {
    console.error('Error previewing statement:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate financial statement preview',
      error: err.message
    });
  }
};

/**
 * Dispatch Statement via Email (Instant test or on-demand dispatch)
 * POST /api/v1/reports/send-now
 */
export const sendStatementNow = async (req, res) => {
  try {
    const userId = req.user?.id;
    let targetEmail = (req.body?.email || '').trim().toLowerCase();
    let htmlStatement = req.body?.html;
    let periodName = req.body?.periodName || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let user = null;
    let budget = null;
    let vault = null;
    let transactions = [];
    let telemetry = null;
    let settings = null;

    const sections = req.body?.sections || (settings?.sections ? (typeof settings.sections.toObject === 'function' ? settings.sections.toObject() : settings.sections) : {});

    if (userId) {
      const [dbUser, dbBudget, dbVault, dbTransactions, dbSettings] = await Promise.all([
        User.findById(userId).select('-password'),
        Budget.findOne({ userId }),
        Vault.findOne({ userId }),
        Transaction.find({ userId }).sort({ date: -1 }).limit(15),
        ReportSettings.findOne({ userId })
      ]);

      user = dbUser;
      budget = dbBudget;
      vault = dbVault;
      transactions = dbTransactions || [];
      settings = dbSettings;

      if (!targetEmail) {
        targetEmail = (settings?.email || user?.email || '').trim().toLowerCase();
      }

      if (!htmlStatement) {
        telemetry = generateFullTelemetry({
          profile: user || {},
          transactions: (transactions || []).map(t => ({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date?.toISOString().split('T')[0] || ''
          })),
          vault: vault || { current: 0, target: 100000 },
          budget: budget || { monthlyIncome: 0, categories: [] }
        });

        htmlStatement = generateExecutiveStatementHTML({
          user: {
            name: user?.name,
            email: user?.email,
            planTier: user?.planTier
          },
          summary: telemetry.summary,
          categories: telemetry.categories,
          transactions: telemetry.transactions,
          periodName,
          sections,
          rule503020: telemetry.rule503020
        });
      }
    }

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required'
      });
    }

    let format = (req.body?.format || settings?.format || 'PDF_AND_HTML').toUpperCase();
    if (format === 'HTML_ONLY') format = 'PDF_AND_HTML';
    const safePeriod = periodName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const attachments = [];

    const txList = transactions || req.body?.transactions || [];
    const sumData = (typeof telemetry !== 'undefined' && telemetry?.summary) || req.body?.summary || {};
    const catList = (typeof telemetry !== 'undefined' && telemetry?.categories) || req.body?.categories || [];
    const userData = user || { name: 'Member Account', email: targetEmail, planTier: 'Pro Edition' };

    // 1. Generate PDF attachment if format is PDF_AND_HTML or PDF_ONLY
    if (format === 'PDF_AND_HTML' || format === 'PDF_ONLY') {
      try {
        const pdfBuffer = await generateExecutiveStatementPDF({
          periodName,
          user: userData,
          summary: sumData,
          categories: catList,
          transactions: txList,
          sections,
          rule503020: (typeof telemetry !== 'undefined' && telemetry?.rule503020) || null
        });

        attachments.push({
          filename: `BudgetBuddy_Statement_${safePeriod}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      } catch (pdfErr) {
        console.warn('PDF attachment generation warning:', pdfErr.message);
      }
    }

    // 2. Generate CSV attachment if format is CSV
    if (format === 'CSV') {
      const csvHeaders = 'Transaction ID,Date,Description,Category,Type,Amount (INR)\n';
      const csvRows = txList.map(t => `"${t.id || ''}","${t.date || ''}","${(t.title || t.name || 'Transaction').replace(/"/g, '""')}","${t.category || 'General'}","${t.type || 'expense'}",${Number(t.amount) || 0}`).join('\n');
      const csvContent = csvHeaders + csvRows;

      attachments.push({
        filename: `BudgetBuddy_Transactions_${safePeriod}.csv`,
        content: csvContent,
        contentType: 'text/csv'
      });
    }

    // 3. Adjust email body & subject based on format
    let emailHtml = htmlStatement || `<h2>Budget Buddy Financial Statement</h2><p>Here is your monthly financial statement for ${periodName}.</p>`;
    let emailText = `Hello,\n\nHere is your official Budget Buddy Monthly Financial Statement for ${periodName}.\n\nBest regards,\nBudget Buddy Team`;
    let emailSubject = `Monthly Financial Statement - ${periodName}`;

    if (format === 'PDF_ONLY') {
      emailHtml = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif; max-width:600px; margin:auto; padding:32px; border:1px solid #e2e8f0; border-radius:8px; color:#1e293b; background:#ffffff;">
          <h2 style="color:#088fff; margin-top:0;">Budget Buddy • Financial Statement</h2>
          <p>Hello <strong>${userData.name || 'Member'}</strong>,</p>
          <p>Your official executive financial statement for <strong>${periodName}</strong> has been generated and is attached to this email as a PDF document.</p>
          <div style="background:#f8fafc; border-left:4px solid #088fff; padding:12px 16px; margin:20px 0; border-radius:4px; font-size:13px;">
            Attachment: <strong>BudgetBuddy_Statement_${safePeriod}.pdf</strong>
          </div>
          <p style="font-size:11px; color:#64748b; margin-top:30px; border-top:1px solid #f1f5f9; padding-top:16px;">
            You are receiving this because you selected <em>PDF Attachment Only</em> in your Budget Buddy report settings.
          </p>
        </div>
      `;
      emailText = `Hello,\n\nPlease find attached your official Budget Buddy Financial Statement for ${periodName} in PDF format.\n\nBest regards,\nBudget Buddy Team`;
    } else if (format === 'CSV') {
      emailSubject = `Transaction Ledger Export - ${periodName}`;
      emailHtml = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif; max-width:600px; margin:auto; padding:32px; border:1px solid #e2e8f0; border-radius:8px; color:#1e293b; background:#ffffff;">
          <h2 style="color:#088fff; margin-top:0;">Budget Buddy • Transaction Ledger Export</h2>
          <p>Hello <strong>${userData.name || 'Member'}</strong>,</p>
          <p>Your complete transaction ledger data export for <strong>${periodName}</strong> has been generated and is attached to this email as a CSV spreadsheet.</p>
          <div style="background:#f8fafc; border-left:4px solid #10b981; padding:12px 16px; margin:20px 0; border-radius:4px; font-size:13px;">
            Attachment: <strong>BudgetBuddy_Transactions_${safePeriod}.csv</strong> (${txList.length} recorded entries)
          </div>
          <p style="font-size:12px; color:#475569;">You can open this CSV file in Microsoft Excel, Google Sheets, or Apple Numbers.</p>
          <p style="font-size:11px; color:#64748b; margin-top:30px; border-top:1px solid #f1f5f9; padding-top:16px;">
            You are receiving this because you selected <em>CSV Data File</em> in your Budget Buddy report settings.
          </p>
        </div>
      `;
      emailText = `Hello,\n\nPlease find attached your complete Budget Buddy Transaction Ledger for ${periodName} in CSV format.\n\nBest regards,\nBudget Buddy Team`;
    }

    // Check credentials: support both SMTP_* or EMAIL_* (e.g. Gmail)
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const emailService = process.env.EMAIL_SERVICE;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;

    if (emailUser && emailPass) {
      const transportConfig = emailService === 'gmail' || smtpHost === 'smtp.gmail.com' || (!smtpHost && emailUser.endsWith('@gmail.com'))
        ? {
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass
            }
          }
        : {
            host: smtpHost || 'smtp.gmail.com',
            port: Number(smtpPort) || 587,
            secure: Number(smtpPort) === 465,
            auth: {
              user: emailUser,
              pass: emailPass
            }
          };

      try {
        const transporter = nodemailer.createTransport(transportConfig);

        const info = await transporter.sendMail({
          from: {
            name: 'Budget Buddy',
            address: emailUser
          },
          to: targetEmail,
          replyTo: emailUser,
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
          attachments
        });

        if (settings) {
          settings.lastSent = new Date();
          await settings.save();
        }

        const formatLabelMap = {
          'PDF_AND_HTML': 'Interactive HTML & PDF Attachment',
          'PDF_ONLY': 'PDF Attachment Only',
          'CSV': 'CSV Data Spreadsheet'
        };

        return res.status(200).json({
          success: true,
          message: `Financial statement (${formatLabelMap[format] || format}) sent successfully to ${targetEmail}`,
          messageId: info.messageId,
          recipient: targetEmail,
          format,
          attachmentsCount: attachments.length,
          timestamp: new Date().toISOString()
        });
      } catch (mailErr) {
        console.error('Nodemailer transmission error:', mailErr);
        if (mailErr.message?.includes('535') || mailErr.message?.includes('BadCredentials') || mailErr.message?.includes('Invalid login')) {
          return res.status(502).json({
            success: false,
            message: `Gmail authentication error: Invalid credentials for ${emailUser}. Please check your Google App Password.`,
            error: mailErr.message
          });
        }
        return res.status(500).json({
          success: false,
          message: `Failed to deliver email: ${mailErr.message}`,
          error: mailErr.message
        });
      }
    }

    // Fallback: If no SMTP credentials are in .env, create an Ethereal test inbox so the user can verify real email output
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const info = await testTransporter.sendMail({
        from: `"Budget Buddy" <${testAccount.user}>`,
        to: targetEmail,
        subject: `Monthly Financial Statement - ${periodName}`,
        html: htmlStatement
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      if (settings) {
        settings.lastSent = new Date();
        await settings.save();
      }

      return res.status(200).json({
        success: true,
        simulated: true,
        previewUrl,
        message: `Test email dispatched! (To send directly to your personal Gmail inbox, configure your Google App Password in server/.env)`,
        recipient: targetEmail,
        timestamp: new Date().toISOString()
      });
    } catch (testErr) {
      console.warn('Ethereal test email error:', testErr.message);
      if (settings) {
        settings.lastSent = new Date();
        await settings.save();
      }

      return res.status(200).json({
        success: true,
        simulated: true,
        message: `Statement staged for ${targetEmail}. Please configure your EMAIL_USER and EMAIL_PASS in server/.env to send live emails.`,
        recipient: targetEmail,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Error dispatching statement:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch financial statement',
      error: err.message
    });
  }
};

/**
 * Manually trigger automated scheduler run (For verification / testing)
 * POST /api/v1/reports/trigger-scheduler
 */
export const triggerAutoScheduler = async (req, res) => {
  try {
    const { processScheduledReports } = await import('../services/reportScheduler.js');
    const result = await processScheduledReports(true);
    return res.status(200).json({
      success: true,
      message: 'Automated report scheduler executed successfully',
      result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to run scheduler',
      error: err.message
    });
  }
};
