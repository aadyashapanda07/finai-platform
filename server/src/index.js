require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initSchema } = require('./db/database');
const { seedData } = require('./db/seed');

const transactionsRoutes = require('./routes/transactions');
const budgetsRoutes = require('./routes/budgets');
const subscriptionsRoutes = require('./routes/subscriptions');
const goalsRoutes = require('./routes/goals');
const insightsRoutes = require('./routes/insights');
const aiRoutes = require('./routes/ai');
const networthRoutes = require('./routes/networth');
const exportRoutes = require('./routes/export');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Startup & Auto-seed Promise (guarantees DB ready before any route executes)
let initPromise = null;
const ensureInitialized = () => {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initSchema();
        await seedData();
      } catch (err) {
        console.error('Database initialization error:', err);
      }
    })();
  }
  return initPromise;
};

// Middleware to ensure DB schema & seed are ready on both local and serverless (Vercel)
app.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (err) {
    console.error('DB init middleware error:', err);
    next();
  }
});

// Health check ping
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'FinAI Platform Backend' });
});

// API Routes
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/networth', networthRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);

if (!process.env.VERCEL) {
  ensureInitialized().then(() => {
    app.listen(PORT, () => {
      console.log(` FinAI Platform Backend running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
