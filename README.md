# 💰 Budget Buddy — Personal Financial Intelligence Platform

> **A modern, enterprise-grade full-stack MERN application for intelligent personal finance management, 50/30/20 rule analytics, emergency vault reserves, EMI loan tracking, Gemini 1.5 Flash AI financial guidance, and an isolated Executive Admin & Grievance Governance Portal.**

---

## 🌟 Key Highlights & Modules

### 1. 📊 Real-Time Financial Telemetry & Dashboard
* Live financial snapshot tracking total income, expenses, net surplus, and savings rate.
* Automatic 50/30/20 budget framework compliance (Needs / Wants / Savings).
* Category spending breakdown with interactive distribution charts.

### 2. 💳 Expense Ledger & Transaction Tracker
* Full CRUD capability for tracking cash inflows and outflows.
* Multi-category tagging, search, and filtering.
* One-click CSV export of transaction logs.

### 3. 🏦 Emergency Savings Vault
* Dedicated emergency fund reserves tracker.
* Dynamic runway estimation (months of typical living expenses covered).
* Visual savings goals and milestones.

### 4. 🧮 EMI Studio & Loan Amortization Engine
* Interactive monthly EMI calculator with principal vs. interest breakdown.
* Full month-by-month loan amortization schedule.
* EMI payment calendar and due date status tracker.

### 5. 🤖 Gemini 1.5 Flash AI Financial Advisor
* Conversational financial intelligence connected directly to user ledger data.
* Human, friendly plain-English advice without confusing financial jargon.
* Prompt starters and 1-click conversation clearing.

### 6. 🛡️ Customer Grievance & Inquiries Support Desk
* Unified support modal for general inquiries and official customer complaints.
* Automated unique ticket ID generation (`CMP-XXXXX` and `INQ-XXXXX`).
* Dual-sync: Simultaneously logs to Google Sheets Webhook and MongoDB Atlas backend.

### 7. 👑 Executive Admin Operations Console (`/admin`)
* **Strictly Isolated Governance**: Separate admin authentication and route protection (`admin@budgetbuddy.app`).
* **Live Telemetry & Real-Time Feed**: Sub-second polling of transacted platform volume and live user activity.
* **Customer Segmentation & Leaderboards**: Tiering users by transaction volume and vault savings.
* **Feedback & Grievance Response Spreadsheet**: Full spreadsheet-style view with status resolution (Pending / Under Review / Resolved) and CSV export.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6 |
| **Backend** | Node.js, Express.js (MVC Pattern), JWT Auth, Morgan, CORS |
| **Database** | MongoDB Atlas / Mongoose ODM |
| **AI Engine** | Google Gemini 1.5 Flash (`@google/genai` SDK + Client Fallback) |
| **Webhooks** | Google Apps Script / Google Sheets API |
| **Testing** | Native Node.js Test Suite (29/29 Core Logic + 12/12 Architecture Tests) |

---

## 📁 Repository Structure

```
Budget-Buddy/
├── client/                     # Vite + React Frontend Application
│   ├── public/                 # Static assets & _redirects
│   ├── src/
│   │   ├── components/         # Modals, Navbar, Footer, UI Cards
│   │   ├── context/            # Authentication & State Providers
│   │   ├── pages/              # Dashboard, Expenses, Budget, EMI, Admin, AI Advisor
│   │   ├── routes/             # App routing & Protected routes
│   │   ├── services/           # Axios API clients & Telemetry services
│   │   └── utils/              # Currency formatters & helpers
│   ├── vercel.json             # Vercel SPA rewrite configuration
│   ├── .env.example            # Frontend environment variable guide
│   └── package.json
│
├── server/                     # Express.js REST API Backend
│   ├── config/                 # MongoDB database connection
│   ├── controllers/            # Route controllers (MVC)
│   ├── middleware/             # JWT auth & Admin route protection
│   ├── models/                 # Mongoose schemas (User, Transaction, Vault, Feedback, etc.)
│   ├── routes/                 # API route definitions
│   ├── services/               # Telemetry, EMI calculation, AI context synthesis
│   ├── test_logic.js           # Core calculation unit tests
│   ├── test_routes.js          # Express architecture & route stack tests
│   ├── .env.example            # Backend environment variable guide
│   ├── index.js                # Server entry point
│   └── package.json
│
├── Documents/                  # Architecture diagrams & project documentation
├── .gitignore                  # Git ignore rules
└── README.md                   # Platform documentation
```

---

## 🚀 Deployment Instructions

### 1. Backend Deployment (Render)
1. Create a **New Web Service** on [Render](https://render.com).
2. Connect this repository and set:
   * **Root Directory**: `server`
   * **Build Command**: `npm install`
   * **Start Command**: `node index.js`
3. Add Environment Variables:
   * `NODE_ENV`: `production`
   * `MONGO_URI`: `your_mongodb_atlas_connection_string`
   * `JWT_SECRET`: `your_secret_key`
   * `CLIENT_URL`: `https://your-frontend.vercel.app`
   * `GEMINI_API_KEY`: `your_gemini_api_key`

### 2. Frontend Deployment (Vercel)
1. Import this repository into [Vercel](https://vercel.com).
2. Set configuration:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Add Environment Variables:
   * `VITE_API_URL`: `https://your-render-backend.onrender.com/api/v1`
   * `VITE_GEMINI_API_KEY`: `your_gemini_api_key`
   * `VITE_GOOGLE_SHEET_CONTACT_URL`: `your_google_sheet_webhook_url`
4. Deploy!

---

## 💻 Local Development Setup

### Prerequisites
* Node.js v18+
* MongoDB Atlas connection or local MongoDB

### 1. Clone & Install
```bash
git clone https://github.com/debadatta77/Budget-Buddy.git
cd Budget-Buddy

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Run Application
```bash
# Start backend (Port 5000)
cd server && npm run dev

# Start frontend (Port 5173)
cd ../client && npm run dev
```

### 3. Run Test Suite
```bash
cd server
npm test
```

---

## 🔐 Credentials for Testing

* **Client User**: Sign up directly on the landing page or use verified test accounts.
* **Executive Admin Portal**: Navigate to `/admin`
  * **Email**: `admin@budgetbuddy.app`
  * **Password**: `AdminMaster2026!#`
