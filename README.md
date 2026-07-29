# 💰 Budget Buddy - Smart Personal Finance Manager (PPD-2)

> 🚀 A modern AI-powered Personal Finance Management System built using the MERN Stack to help users manage expenses, budgets, savings, and financial insights efficiently.

![MERN](https://img.shields.io/badge/Stack-MERN-green)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-success)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![License](https://img.shields.io/badge/License-MIT-orange)

---

# 📖 Table of Contents

- 📌 Project Overview
- ✨ Features
- 🆕 PPD-2 Enhancements
- 🛠️ Tech Stack
- 🏗️ Project Structure
- 🗄️ Database Models
- 🔗 REST APIs
- 🧠 AI Features
- 📊 Financial Health Score
- 📈 Analytics
- 📄 Monthly Reports
- 🔐 Authentication
- 🚀 Installation
- ▶️ Running the Project
- 🌐 Deployment
- 👨‍💻 Contributors
- 📜 License

---

# 📌 Project Overview

Budget Buddy is a full-stack MERN application designed to help users monitor and improve their financial habits.

Users can:

- 💸 Track expenses
- 🎯 Create budgets
- 💰 Manage savings goals
- 📈 Analyze spending
- 🤖 Get AI-powered financial insights
- 📄 Download monthly reports

---

# ✨ Core Features

## 👤 User Authentication

- Register
- Login
- JWT Authentication
- Password Encryption
- Protected Routes

---

## 💸 Expense Management

- Add Expense
- Edit Expense
- Delete Expense
- Search Expense
- Filter Expense
- Category-wise Expenses

---

## 🎯 Budget Management

- Create Budget
- Update Budget
- Track Remaining Budget
- Budget Utilization

---

## 💰 Savings Goals

- Create Goal
- Track Progress
- Target Amount
- Remaining Amount

---

## 📊 Dashboard

- Total Expenses
- Monthly Budget
- Savings
- Recent Transactions
- Charts
- AI Insights

---

## 📞 Contact & Support

- Contact Form
- Feedback
- User Queries

---

## 👨‍💼 Admin Panel

- Total Users
- Total Expenses
- Analytics
- Contact Requests

---

# 🆕 PPD-2 Enhancements

## 🤖 AI Financial Advisor

- AI Chat Assistant
- Budget Suggestions
- Spending Advice
- Financial Recommendations

---

## 📊 Financial Health Score

Score based on:

- Budget Discipline
- Savings
- Spending Pattern
- Expense Tracking

Score:

```
85 / 100
Excellent Financial Health
```

---

## 📄 Monthly PDF Reports

Includes:

- Expense Summary
- Budget Summary
- Savings
- Charts
- AI Summary
- Financial Health Score

---

## 📈 Advanced Analytics

- Monthly Trend
- Weekly Trend
- Category Analysis
- Pie Chart
- Bar Chart
- Line Chart
- Spending Distribution

---

# 🛠️ Tech Stack

## Frontend

- React.js
- React Router
- Axios
- Chart.js
- Tailwind CSS

---

## Backend

- Node.js
- Express.js

---

## Database

- MongoDB Atlas
- Mongoose

---

## Authentication

- JWT
- bcrypt

---

## AI

- OpenAI API

---

## Deployment

- Vercel
- Render
- MongoDB Atlas

---

# 🏗️ Project Structure

```
budget-buddy-ppd2/

client/
server/

README.md
```

---

# 🗄️ Database Models

### User

- Name
- Email
- Password
- Role

---

### Expense

- Title
- Amount
- Category
- Date
- Payment Method
- Notes

---

### Budget

- Category
- Limit
- Month

---

### Savings Goal

- Goal Name
- Target Amount
- Saved Amount
- Deadline

---

### Contact

- Name
- Email
- Subject
- Message

---

### AI Chat

- User
- Prompt
- Response
- Timestamp

---

# 🔗 REST APIs

## Authentication

```
POST /api/auth/register

POST /api/auth/login

GET /api/auth/profile
```

---

## Expenses

```
GET /api/expenses

POST /api/expenses

PUT /api/expenses/:id

DELETE /api/expenses/:id
```

---

## Budget

```
GET /api/budget

POST /api/budget

PUT /api/budget/:id

DELETE /api/budget/:id
```

---

## Savings

```
GET /api/savings

POST /api/savings
```

---

## Analytics

```
GET /api/analytics
```

---

## Reports

```
GET /api/report/monthly
```

---

## AI

```
POST /api/ai/chat
```

---

## Financial Health

```
GET /api/financial-health
```

---

# 🤖 AI Features

- AI Dashboard Insights
- AI Financial Advisor
- Expense Suggestions
- Budget Suggestions
- AI Monthly Summary

---

# 📊 Financial Health Score

Calculated using:

- Budget Usage
- Saving Habit
- Expense Distribution
- Spending Consistency

---

# 📈 Analytics

- Expense Trends
- Category Distribution
- Monthly Analysis
- Weekly Analysis
- Daily Average
- Budget Utilization

---

# 📄 Monthly Report

Download a professional PDF containing:

- Expenses
- Budget
- Savings
- Financial Score
- Charts
- AI Summary

---

# 🔐 Security

- JWT Authentication
- Password Hashing
- Protected APIs
- Role-based Access
- Input Validation

---

# 🚀 Installation

Clone Repository

```bash
git clone https://github.com/yourusername/budget-buddy-ppd2.git
```

Frontend

```bash
cd client
npm install
npm run dev
```

Backend

```bash
cd server
npm install
npm run dev
```

---

# 🌐 Deployment

Frontend

- Vercel

Backend

- Render

Database

- MongoDB Atlas

---

# 👨‍💻 Contributors

- **Debadatta** – Backend Development
- **Your Friend** – Frontend Development

---

# 🎯 Future Scope

- Voice Assistant
- Mobile Application
- OCR Bill Scanner
- Multi-Currency Support
- Bank API Integration
- Investment Tracking

---

# 📜 License

This project is developed for educational and academic purposes under PPD-2.

---

# ⭐ If you like this project, don't forget to give it a star!
