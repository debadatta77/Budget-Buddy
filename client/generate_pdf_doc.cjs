const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(__dirname, 'Budget_Buddy_Project_Documentation.pdf');

const doc = new PDFDocument({
  margin: 40,
  size: 'A4',
  bufferPages: true
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Color Palette
const PRIMARY = '#088FFF';
const SECONDARY = '#0F172A';
const DARK_BG = '#1E293B';
const TEXT_DARK = '#334155';
const BORDER_COLOR = '#E2E8F0';

// Page dimensions
const pageWidth = doc.page.width - 80;

// Helper function to draw section header
function addSectionHeader(title, subtitle = '') {
  doc.moveDown(0.8);
  if (doc.y > 700) doc.addPage();
  
  const startY = doc.y;
  doc.rect(40, startY, 4, 24).fill(PRIMARY);
  
  doc.fillColor(SECONDARY)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(title, 52, startY + 2);
     
  if (subtitle) {
    doc.fillColor('#64748B')
       .fontSize(8.5)
       .font('Helvetica')
       .text(subtitle, 52, startY + 18);
  }
  
  doc.moveDown(1.2);
}

// Helper function for sub headers
function addSubHeader(title) {
  if (doc.y > 720) doc.addPage();
  doc.moveDown(0.5);
  doc.fillColor(PRIMARY)
     .fontSize(11)
     .font('Helvetica-Bold')
     .text(title, 40);
  doc.moveDown(0.3);
}

// Helper function for code blocks
function addCodeBlock(code) {
  const lines = code.trim().split('\n');
  const lineHeight = 11;
  const padding = 8;
  const blockHeight = lines.length * lineHeight + (padding * 2);
  
  if (doc.y + blockHeight > 740) {
    doc.addPage();
  }
  
  const startY = doc.y;
  
  doc.rect(40, startY, pageWidth, blockHeight)
     .fillAndStroke(DARK_BG, '#334155');
     
  doc.fillColor('#F1F5F9')
     .fontSize(8)
     .font('Courier');
     
  lines.forEach((line, index) => {
    doc.text(line, 48, startY + padding + (index * lineHeight), {
      width: pageWidth - 16,
      lineBreak: false
    });
  });
  
  doc.y = startY + blockHeight + 8;
  doc.font('Helvetica').fillColor(TEXT_DARK);
}

// Helper function for tables
function addTable(headers, rows, columnWidths) {
  const cellPadding = 5;
  const fontSize = 8;
  
  const calculateRowHeight = (row, isHeader = false) => {
    let maxHeight = 18;
    row.forEach((cell, i) => {
      doc.fontSize(fontSize).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      const h = doc.heightOfString(cell.toString(), { width: columnWidths[i] - (cellPadding * 2) }) + (cellPadding * 2);
      if (h > maxHeight) maxHeight = h;
    });
    return maxHeight;
  };
  
  // Header
  const headerHeight = calculateRowHeight(headers, true);
  if (doc.y + headerHeight > 740) doc.addPage();
  
  let currentY = doc.y;
  doc.rect(40, currentY, pageWidth, headerHeight).fill('#F1F5F9');
  
  let currentX = 40;
  headers.forEach((header, i) => {
    doc.fillColor(SECONDARY)
       .fontSize(fontSize)
       .font('Helvetica-Bold')
       .text(header, currentX + cellPadding, currentY + cellPadding, {
         width: columnWidths[i] - (cellPadding * 2),
         align: 'left'
       });
    currentX += columnWidths[i];
  });
  
  currentY += headerHeight;
  
  // Rows
  rows.forEach((row, rowIndex) => {
    const rHeight = calculateRowHeight(row);
    if (currentY + rHeight > 740) {
      doc.addPage();
      currentY = doc.y;
    }
    
    if (rowIndex % 2 === 1) {
      doc.rect(40, currentY, pageWidth, rHeight).fill('#FAFAFA');
    }
    doc.rect(40, currentY, pageWidth, rHeight).stroke(BORDER_COLOR);
    
    currentX = 40;
    row.forEach((cell, i) => {
      doc.fillColor(TEXT_DARK)
         .fontSize(fontSize)
         .font('Helvetica')
         .text(cell.toString(), currentX + cellPadding, currentY + cellPadding, {
           width: columnWidths[i] - (cellPadding * 2),
           align: 'left'
         });
      currentX += columnWidths[i];
    });
    
    currentY += rHeight;
  });
  
  doc.y = currentY + 10;
}

// ---------------- COVER / HEADER BANNER ----------------
doc.rect(40, 40, pageWidth, 110).fill(SECONDARY);

// Title Banner
doc.fillColor('#FFFFFF')
   .fontSize(22)
   .font('Helvetica-Bold')
   .text('BUDGET BUDDY ENHANCEMENT', 60, 58);

doc.fillColor(PRIMARY)
   .fontSize(11)
   .font('Helvetica-Bold')
   .text('FULL-STACK TECHNICAL BLUEPRINT & BACKEND HANDOFF DOCUMENT', 60, 86);

doc.fillColor('#94A3B8')
   .fontSize(9)
   .font('Helvetica')
   .text('Target Platform: Node.js / Express • PostgreSQL / Prisma • Resend / Nodemailer • Gemini AI', 60, 104);

doc.fillColor('#64748B')
   .fontSize(8.5)
   .text(`Generated: September 2026  |  Author: Antigravity AI  |  Version: 1.0.0 (Production Blueprint)`, 60, 122);

doc.y = 170;

// ---------------- 1. EXECUTIVE SUMMARY ----------------
addSectionHeader('1. Executive Summary & Application Overview', 'Core functionality and verified client capabilities');

doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
  'Budget Buddy is an editorial-grade, modern personal finance telemetry platform and expense management system. ' +
  'It provides users with live financial telemetry, automated month-end financial reporting, net worth tracking, wealth allocation ' +
  'under the 50/30/20 budget framework, emergency vault management, and an AI-driven financial advisor assistant.',
  40, doc.y, { width: pageWidth, align: 'justify' }
);

doc.moveDown(0.6);
addSubHeader('Key Verified Client-Side Capabilities:');

const capabilities = [
  ['Financial Telemetry Engine', 'Computes Monthly Net Worth, Total Income, Total Expenses, Net Cashflow, Savings Rate, and Category Share.'],
  ['50/30/20 Wealth System', 'Splits monthly income into Needs (50%), Wants (30%), and Savings/Vault (20%) reserves.'],
  ['Transaction Ledger', 'Real-time ledger with search filtering, multi-category tags, custom dates, and deletion handlers.'],
  ['Emergency Vault', 'Target vs Current emergency fund tracker with visual progress indicators.'],
  ['Month-End Email Reports', 'Generates HTML & PDF financial statements with 6-month cashflow charts & AI audit insights.'],
  ['AI Financial Advisor', 'Interactive AI assistant integrated with Google Gemini REST API (gemini-2.5-flash).'],
  ['EMI & Virtual Card Studio', 'Virtual card designer & interactive monthly EMI calculation engine.'],
  ['Verified Authentication', 'Dual-tab modal (GetStartedModal) and /auth route for sign up and strict user verification.']
];

addTable(['Module / Feature', 'Description & Operation Scope'], capabilities, [140, pageWidth - 140]);

// ---------------- 2. ARCHITECTURE OVERVIEW ----------------
addSectionHeader('2. Technical Stack & System Architecture', 'Target end-to-end full-stack topology');

doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
  'The current application is built as a single-page React 19 application powered by Vite. ' +
  'Data is managed via a centralized localStorage service with custom window event dispatchers. ' +
  'The backend developer will replace localStorage calls with RESTful HTTPS endpoints backed by a Node.js Express server and PostgreSQL database.',
  40, doc.y, { width: pageWidth, align: 'justify' }
);

doc.moveDown(0.6);
addCodeBlock(`+-----------------------------------------------------------------+
|                    React 19 Frontend (Vite)                     |
|  (AppRoutes, AuthContext, Dashboard, Expenses, Analytics, etc.) |
+--------------------------------┬--------------------------------+
                                 |
                     HTTPS / REST API (JWT Bearer)
                                 |
+--------------------------------v--------------------------------+
|                   Node.js / Express Backend                     |
| +----------------------+-------------------+------------------+ |
| | Auth & User Middleware| Financial Telemetry| AI Proxy Engine  | |
| +----------------------+-------------------+------------------+ |
+--------------┬-----------------┬------------------┬-------------+
               |                 |                  |
    +----------v----------+ +----v-------------+ +--v------------+
    |  PostgreSQL Database| | Automated Cron   | | Google Gemini |
    |  (Prisma ORM Schema)| | (Resend / Email) | | AI REST API   |
    +---------------------+ +------------------+ +---------------+`);

// ---------------- 3. DATABASE SCHEMAS ----------------
addSectionHeader('3. Database Schema & Data Models (Entity-Relationship Blueprint)', 'PostgreSQL SQL DDL and Prisma ORM Model Specifications');

addSubHeader('3.1 Entity: users');
addCodeBlock(`CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  currency VARCHAR(50) DEFAULT 'INR (₹)',
  plan_tier VARCHAR(50) DEFAULT 'Pro Member',
  region VARCHAR(100) DEFAULT 'India (IN)',
  account_uid VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`);

addSubHeader('3.2 Entity: linked_accounts');
addCodeBlock(`CREATE TABLE linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(100) NOT NULL,
  number_masked VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'VERIFIED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`);

addSubHeader('3.3 Entity: transactions');
addCodeBlock(`CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`);

addSubHeader('3.4 Entity: budgets & budget_categories');
addCodeBlock(`CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  monthly_income NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  allocated_amount NUMERIC(12, 2) NOT NULL,
  color VARCHAR(20) DEFAULT '#088fff'
);`);

addSubHeader('3.5 Entity: savings_goals & vault');
addCodeBlock(`CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  category VARCHAR(100) DEFAULT 'General',
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_amount NUMERIC(12, 2) DEFAULT 0,
  target_amount NUMERIC(12, 2) DEFAULT 200000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`);

addSubHeader('3.6 Entity: report_settings');
addCodeBlock(`CREATE TABLE report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  email VARCHAR(255) NOT NULL,
  schedule VARCHAR(50) DEFAULT 'MONTH_END',
  format VARCHAR(50) DEFAULT 'PDF_AND_HTML',
  sections JSONB DEFAULT '{"cashFlowCharts": true, "categoryBreakdown": true, "rule503020": true, "aiAdvisorInsights": true, "transactionLedger": true}',
  last_sent TIMESTAMP WITH TIME ZONE,
  next_scheduled TIMESTAMP WITH TIME ZONE
);`);

// ---------------- 4. RESTful API ENDPOINTS ----------------
addSectionHeader('4. RESTful API Endpoint Specifications', 'Complete router mapping for backend controllers');

addSubHeader('4.1 Authentication & Profile Router (/api/v1/auth & /api/v1/user)');
const authApi = [
  ['POST', '/api/v1/auth/register', 'Public', 'Register new user account', '{ name, email, password }'],
  ['POST', '/api/v1/auth/login', 'Public', 'User authentication & JWT issue', '{ email, password }'],
  ['POST', '/api/v1/auth/logout', 'Protected', 'Invalidate active JWT session', 'None'],
  ['GET', '/api/v1/user/profile', 'Protected', 'Fetch active profile details', 'None'],
  ['PUT', '/api/v1/user/profile', 'Protected', 'Update user settings', '{ name, currency, region }'],
  ['GET', '/api/v1/user/bank-accounts', 'Protected', 'List connected bank accounts', 'None'],
  ['POST', '/api/v1/user/bank-accounts', 'Protected', 'Link new financial account', '{ bank, type, number }']
];
addTable(['Method', 'Endpoint Path', 'Access', 'Function', 'Payload'], authApi, [45, 130, 50, 140, 150]);

addSubHeader('4.2 Transaction Ledger Router (/api/v1/transactions)');
const txApi = [
  ['GET', '/api/v1/transactions', 'Protected', 'Fetch transactions (with page, search, category filters)', 'Query Parameters'],
  ['POST', '/api/v1/transactions', 'Protected', 'Record new income or expense item', '{ title, category, amount, type, date }'],
  ['DELETE', '/api/v1/transactions/:id', 'Protected', 'Delete transaction record by ID', 'URL Parameter :id'],
  ['DELETE', '/api/v1/transactions/clear-all', 'Protected', 'Purge all user transactions', 'None']
];
addTable(['Method', 'Endpoint Path', 'Access', 'Function', 'Payload'], txApi, [45, 145, 50, 140, 135]);

addSubHeader('4.3 Telemetry, Budget, Vault & Reports Router');
const miscApi = [
  ['GET', '/api/v1/telemetry/summary', 'Protected', 'Computes net worth, cashflow & 50/30/20 metrics', 'Returns JSON Telemetry'],
  ['GET', '/api/v1/telemetry/health', 'Protected', 'Computes Financial Health Index (0-100 score)', 'Returns Score & Pillar Breakdown'],
  ['GET', '/api/v1/budget', 'Protected', 'Fetch monthly income & category budget limits', 'None'],
  ['PUT', '/api/v1/budget', 'Protected', 'Update budget income and allocations', '{ monthlyIncome, categories: [...] }'],
  ['GET', '/api/v1/savings/vault', 'Protected', 'Fetch emergency vault balance & target', 'None'],
  ['PUT', '/api/v1/savings/vault', 'Protected', 'Deposit / withdraw vault funds', '{ current, target }'],
  ['POST', '/api/v1/reports/send-test', 'Protected', 'Dispatch instant month-end report email', '{ email }'],
  ['POST', '/api/v1/ai/chat', 'Protected', 'Proxy prompt to Gemini API with context', '{ prompt: string }']
];
addTable(['Method', 'Endpoint Path', 'Access', 'Function', 'Payload'], miscApi, [45, 145, 50, 140, 135]);

// ---------------- 5. TELEMETRY LOGIC & FORMULAS ----------------
addSectionHeader('5. Core Telemetry Logic & Mathematical Reference', 'Server-side calculation specifications');

doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
  'The backend service must implement the following mathematical formulas to compute telemetry metrics dynamically:',
  40, doc.y
);

doc.moveDown(0.6);
addSubHeader('A. Monthly Net Worth Formula:');
addCodeBlock(`Monthly Net Worth = (Total Monthly Income - Total Monthly Expenses) + Emergency Vault Reserves`);

addSubHeader('B. 50/30/20 Wealth Allocation Engine:');
addCodeBlock(`Needs Amount (50%) = Monthly Income * 0.50  (Rent, Groceries, Utilities, EMIs)
Wants Amount (30%) = Monthly Income * 0.30  (Dining, Hobbies, Shopping)
Savings Amount (20%)= Monthly Income * 0.20  (Emergency Vault & SIP Investments)`);

addSubHeader('C. Financial Health Index (0 - 100 Scale):');
addCodeBlock(`1. Savings Rate Metric (40% Weight) = (Net Savings / Total Income) * 100  [Benchmark: >= 20%]
2. Burn Rate Control (30% Weight)   = Ratio of actual burn to 50/30 recommended budget
3. Vault Safety Margin (30% Weight) = Ratio of current vault balance to target reserve goal`);

// ---------------- 6. AUTOMATED CRON & EMAIL DISPATCH ----------------
addSectionHeader('6. Server-Side Automated Cron Job & Email Dispatch', 'Automated month-end financial statement delivery service');

doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
  'Create a server-side background worker (e.g. server/workers/reportCron.js) using node-cron and Resend or Nodemailer:',
  40, doc.y
);

doc.moveDown(0.6);
addCodeBlock(`import cron from 'node-cron';
import { generateReportHTMLDocument } from '../services/reportGenerator.js';
import { sendEmailWithAttachment } from '../services/emailService.js';
import { prisma } from '../lib/prisma.js';

// Schedule to run at 23:50 on the 28th of every month
cron.schedule('50 23 28 * *', async () => {
  console.log('[CRON] Initiating Month-End Financial Report Dispatch...');
  
  const activeSubscriptions = await prisma.reportSettings.findMany({
    where: { enabled: true }
  });

  for (const config of activeSubscriptions) {
    try {
      const htmlContent = await generateReportHTMLDocument(config.userId);
      await sendEmailWithAttachment({
        to: config.email,
        subject: 'Official Budget Buddy Monthly Statement',
        html: htmlContent
      });
      
      await prisma.reportSettings.update({
        where: { id: config.id },
        data: { lastSent: new Date() }
      });
    } catch (err) {
      console.error(\`[CRON ERROR] Failed for user \${config.userId}:\`, err);
    }
  }
});`);

// ---------------- 7. FRONTEND INTEGRATION BLUEPRINT ----------------
addSectionHeader('7. Frontend Integration Blueprint', 'Migrating from LocalStorage service to HTTP API client');

doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica').text(
  'Create an Axios client instance (src/services/apiClient.js) with JWT interceptors, then update userDataService.js to perform HTTP requests:',
  40, doc.y
);

doc.moveDown(0.6);
addCodeBlock(`// client/src/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('budget_buddy_jwt_token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default apiClient;`);

// ---------------- 8. ENVIRONMENT & SETUP GUIDE ----------------
addSectionHeader('8. Developer Setup & Environment Configuration', 'Environment secrets and CLI build commands');

addSubHeader('Frontend Environment (.env)');
addCodeBlock(`VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here`);

addSubHeader('Backend Environment (.env)');
addCodeBlock(`PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/budget_buddy?schema=public
JWT_SECRET=super_secret_jwt_key_budget_buddy_2026
GEMINI_API_KEY=your_google_gemini_api_key_here
RESEND_API_KEY=re_123456789
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=your_smtp_password
FRONTEND_URL=http://localhost:5173`);

// ---------------- 9. NEXT STEPS ROADMAP ----------------
addSectionHeader('9. Next Steps Summary for Future Developer', 'Action items for full project completion');

const nextSteps = [
  ['1. Database Setup', 'Initialize PostgreSQL database and execute Prisma migrations using schema defined in Section 3.'],
  ['2. Express REST API', 'Implement authentication controllers (JWT + bcrypt), transaction CRUD routes, and telemetry middleware.'],
  ['3. AI Proxy Endpoint', 'Migrate direct Gemini API call from client GeminiAdvisorChat.jsx to server /api/v1/ai/chat proxy.'],
  ['4. Month-End Cron Job', 'Configure Resend / Nodemailer transport in reportCron.js background worker for auto email dispatch.'],
  ['5. Frontend Hookup', 'Replace LocalStorage helper methods in client/src/services/userDataService.js with apiClient requests.']
];
addTable(['Step', 'Implementation Task'], nextSteps, [130, pageWidth - 130]);

// ---------------- FOOTER AND PAGE NUMBERING ----------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  if (i > 0) {
    doc.rect(40, 20, pageWidth, 0.5).fill('#CBD5E1');
    doc.fillColor('#94A3B8')
       .fontSize(7.5)
       .font('Helvetica-Bold')
       .text('BUDGET BUDDY ENHANCEMENT — FULL-STACK TECHNICAL BLUEPRINT', 40, 10);
  }
  
  doc.rect(40, 800, pageWidth, 0.5).fill('#CBD5E1');
  doc.fillColor('#94A3B8')
     .fontSize(8)
     .font('Helvetica')
     .text(`Budget Buddy Financial Telemetry Engine • Confidential Developer Handoff Specification`, 40, 806);
     
  doc.text(`Page ${i + 1} of ${range.count}`, 40, 806, {
    width: pageWidth,
    align: 'right'
  });
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF successfully created at: ${outputPath}`);
});
