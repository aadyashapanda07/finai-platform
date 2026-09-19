# 🚀 FinAI — AI-Powered Personal Finance & Wealth Platform

[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0-003B57.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**FinAI** is a modern full-stack personal finance application that enables users to track income, expenses, budgets, recurring subscriptions, and savings milestones through natural language input and smart receipt scanning. It delivers actionable, intelligent analytics into your financial health with an interactive compound wealth simulator and automated subscription leak detection.

---

## 🌟 Key Features

### 1. 🤖 AI Natural Language Omnibar with Voice Dictation (`Ctrl + K`)
- Log expenses, income, budgets, subscriptions, and savings goals using natural conversational phrases.
- **Voice Dictation**: Tap the microphone button to dictate expenses hands-free using real-time speech-to-text.
- Instant entity extraction for Amount, Type, Category, Merchant, and Date with editable tag pills and 1-click confirmation.
- *Examples*:
  - *"Spent $48.50 at Trader Joe's for groceries yesterday"*
  - *"Received $3,500 salary from Acme Corp"*
  - *"Dinner with friends at Chipotle $28.40"*
  - *"Budget $400 for Dining Out"*
  - *"Save $250 for Kyoto Autumn Vacation"*

### 2. 🧾 Smart Receipt Scanner & OCR (`Ctrl + R`)
- **Live Camera Capture**: Snap photos of paper receipts directly from your phone or webcam.
- **Image File Upload**: Drag-and-drop JPEG, PNG, or WebP receipts.
- **Preloaded Test Receipts**: One-click demo receipts (*Whole Foods Market*, *Bella Vista Trattoria*, *Best Buy*).
- Auto-extracts merchant, transaction date, itemized line items with individual prices, tax, tip, and total.

### 3. 🔮 Interactive "What-If" Financial Sandbox
- **Expense Trimming Levers**: Model the impact of cutting discretionary spend or pruning duplicate subscriptions to see instant annual cash reclaimed.
- **Compound Wealth Growth Engine**: Dynamic sliders for Monthly Contribution, Initial Capital, APY Return (4–14%), and Projection Horizon (1–25 years).
- **Preset Strategies**: 1-click toggles for `[Conservative]`, `[Balanced]`, and `[Aggressive]`.
- **Save as Goal**: Directly establish your projected wealth trajectory as an active goal in your planner.

### 4. 💎 Net Worth, Assets & Liabilities Ledger
- **Net Worth Tracking**: Total Assets minus Total Outstanding Liabilities.
- **Portfolio Allocation**: Interactive Recharts Donut showing distribution across Cash, Equities/Brokerage, 401(k) Retirement, and Crypto.
- **Debt-to-Asset Ratio**: Monitors leverage health with safety benchmarks (< 35%).
- **Full CRUD Support**: Add, edit, or remove bank holdings, loans, credit cards, and investments.

### 5. 🔍 Subscription & Recurring Leak Detector
- Automated audit of monthly and annual recurring commitments.
- Flags redundant subscriptions (e.g. Apple Music alongside Spotify) and unused memberships.
- 1-click **"Cancel Service"** and **"Dismiss / Keep Service"** actions.

### 6. 🛡️ Financial Health Score & 90-Day Predictive Forecasting
- Composite score (0–100) assessing 4 key pillars: **Savings Rate**, **Budget Discipline**, **Emergency Cushion**, and **Subscription Efficiency**.
- 30, 60, and 90-day cash flow projections based on current run rates.
- Dynamic Actionable Insights feed highlighting spending spikes and savings opportunities.

### 7. 🎯 Savings Goals & Milestones
- Visual progress bars for emergency cushions, vacation funds, and car down payments.
- Quick **Deposit** and safe **Withdrawal** modals with celebration confetti animations.

### 8. 📤 Data Portability: 1-Click CSV & JSON Export / Import (`Ctrl + E`)
- **Export to CSV**: Download your complete ledger for tax preparation, Excel, or Google Sheets.
- **Backup & Restore to JSON**: Complete platform backup archive with 1-click restore.

### 9. 💬 Conversational FinAI Wealth Coach
- Interactive chatbot for personalized financial advice and cash flow strategy.
- Dual-mode intelligence: works 100% offline out-of-the-box with deterministic rule heuristics, with optional Google Gemini API key toggle.

### 10. ⚡ Keyboard Shortcuts (`?`)
- `Ctrl + K` / `Cmd + K`: Open AI Omnibar
- `Ctrl + R` / `Cmd + R`: Open Receipt Scanner
- `Ctrl + N` / `Cmd + N`: Manual Transaction Entry
- `Ctrl + E` / `Cmd + E`: Export / Import Hub
- `?`: Open Keyboard Shortcuts Cheat Sheet

---

## 🏗️ Project Architecture

```
finai-platform/
├── package.json               # Root scripts (concurrent dev runner, seed, build)
├── README.md                  # Project documentation
├── .gitignore                 # Git ignore configuration
├── server/                    # Node.js + Express Backend
│   ├── package.json
│   ├── .env.example           # Environment template
│   ├── data/                  # SQLite storage
│   │   ├── .gitkeep
│   │   └── finance.db         # Auto-generated SQLite database
│   └── src/
│       ├── index.js           # Server entry point (port 5000)
│       ├── db/
│       │   ├── database.js    # Schema migrations & connection
│       │   └── seed.js        # Realistic demo data seeder
│       ├── routes/            # REST API endpoints
│       │   ├── transactions.js# CRUD + summary
│       │   ├── budgets.js     # CRUD + ±$50 tuning
│       │   ├── subscriptions.js# CRUD + leak dismissal
│       │   ├── goals.js       # CRUD + deposit / withdraw
│       │   ├── networth.js    # Assets & Liabilities CRUD
│       │   ├── insights.js    # Health engine & Dismiss All
│       │   ├── export.js      # CSV & JSON export / import
│       │   ├── settings.js    # Reseed & ledger wipe
│       │   └── ai.js          # Chatbot & NLP router
│       └── services/
│           ├── nlpParser.js   # Local NLP rules & Gemini fallback
│           ├── receiptScanner.js # OCR engine & sample parser
│           └── healthAnalytics.js# 4-pillar health score & forecasting
└── client/                    # React 19 + Vite + Tailwind CSS Frontend
    ├── package.json
    ├── vite.config.js         # Port 3000 + proxy to :5000
    ├── tailwind.config.js
    └── src/
        ├── App.jsx            # Top-level state coordinator & date pills
        ├── main.jsx
        ├── index.css          # Fintech dark theme styles
        ├── components/        # Modular UI components
        │   ├── Navbar.jsx
        │   ├── HealthScoreCard.jsx
        │   ├── InsightsFeed.jsx
        │   ├── CashFlowChart.jsx
        │   ├── CategoryDonut.jsx
        │   ├── TransactionTable.jsx
        │   ├── BudgetCards.jsx
        │   ├── SubscriptionTracker.jsx
        │   ├── GoalsGrid.jsx
        │   ├── NetWorthView.jsx
        │   ├── WhatIfSimulator.jsx
        │   ├── AIAdvisorChat.jsx
        │   ├── NaturalLanguageModal.jsx
        │   ├── ReceiptScannerModal.jsx
        │   ├── ManualTransactionModal.jsx
        │   ├── ExportImportModal.jsx
        │   ├── ShortcutsModal.jsx
        │   ├── SettingsModal.jsx
        │   └── Toast.jsx
        └── utils/
            └── api.js         # Typed fetch API client
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` (comes with Node.js)

### 1. Installation
In the project root directory:
```bash
# Install root dependencies
npm install

# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

### 2. Run the Application
Start both frontend and backend concurrently with a single command:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)

### 3. Useful Commands
- `npm run seed`: Reset and re-seed the SQLite database with rich sample data.
- `npm run build`: Compile the React client into production-ready static assets in `client/dist`.
- `npm run server`: Run only the Express backend server.
- `npm run client`: Run only the Vite frontend development server.

---

## ⚙️ Configuration (Optional)

FinAI runs **100% offline out-of-the-box** using built-in rule-based NLP parsers and heuristic receipt OCR.

If you'd like to enable Google Gemini cloud AI for conversational coaching or multimodal vision OCR:
1. Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
2. Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Or simply paste your key inside the application via the **Settings (gear icon)** modal in the UI!

---

## 📄 License
This project is licensed under the MIT License — feel free to use it for personal or educational projects!
