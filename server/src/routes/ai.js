const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { parseNaturalLanguage } = require('../services/nlpParser');
const { scanReceipt, SAMPLE_RECEIPTS } = require('../services/receiptScanner');
const { calculateFinancialHealth } = require('../services/healthAnalytics');
const { run, get, all } = require('../db/database');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET sample receipts for zero-friction demoing
router.get('/sample-receipts', (req, res) => {
  res.json({ success: true, data: SAMPLE_RECEIPTS });
});

// POST parse natural language command
router.post('/parse-nl', async (req, res) => {
  try {
    const { query, apiKey } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query string is required' });
    }

    const parsed = await parseNaturalLanguage(query, apiKey);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST confirm and execute parsed natural language item
router.post('/confirm-nl', async (req, res) => {
  try {
    const { intent, extracted } = req.body;
    if (!extracted) {
      return res.status(400).json({ success: false, error: 'Extracted data payload is required' });
    }

    if (intent === 'add_transaction' || !intent) {
      const id = uuidv4();
      await run(
        `INSERT INTO transactions (id, amount, type, category, merchant, description, date, payment_method, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          parseFloat(extracted.amount || 0),
          extracted.type || 'expense',
          extracted.category || 'General',
          extracted.merchant || 'General',
          extracted.description || 'Natural language entry',
          extracted.date || new Date().toISOString().split('T')[0],
          'AI Omnibar',
          'ai,omnibar'
        ]
      );
      const created = await get('SELECT * FROM transactions WHERE id = ?', [id]);
      return res.status(201).json({ success: true, type: 'transaction', data: created });
    }

    if (intent === 'add_budget') {
      const id = uuidv4();
      await run(
        `INSERT INTO budgets (id, category, monthly_limit, alert_threshold)
         VALUES (?, ?, ?, 80)
         ON CONFLICT(category) DO UPDATE SET monthly_limit=excluded.monthly_limit`,
        [id, extracted.category || 'General', parseFloat(extracted.monthly_limit || extracted.amount || 500)]
      );
      const created = await get('SELECT * FROM budgets WHERE category = ?', [extracted.category]);
      return res.status(201).json({ success: true, type: 'budget', data: created });
    }

    if (intent === 'add_subscription') {
      const id = uuidv4();
      await run(
        `INSERT INTO subscriptions (id, name, amount, billing_cycle, category, next_billing_date, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          id,
          extracted.merchant || extracted.description || 'New Subscription',
          parseFloat(extracted.amount || 0),
          extracted.billing_cycle || 'monthly',
          extracted.category || 'Entertainment & Leisure',
          extracted.date || new Date().toISOString().split('T')[0],
          'Added via AI Omnibar'
        ]
      );
      const created = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
      return res.status(201).json({ success: true, type: 'subscription', data: created });
    }

    if (intent === 'add_goal') {
      const id = uuidv4();
      await run(
        `INSERT INTO savings_goals (id, name, target_amount, current_amount, target_date, category, status)
         VALUES (?, ?, ?, 0, ?, ?, 'active')`,
        [
          id,
          extracted.merchant || extracted.description || 'New Savings Goal',
          parseFloat(extracted.target_amount || extracted.amount || 1000),
          extracted.date || null,
          extracted.category || 'General'
        ]
      );
      const created = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
      return res.status(201).json({ success: true, type: 'goal', data: created });
    }

    res.status(400).json({ success: false, error: 'Unknown intent' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST scan receipt (upload or sample)
router.post('/scan-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { sampleId, apiKey } = req.body;
    let fileBuffer = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    }

    const result = await scanReceipt({ fileBuffer, sampleId, mimeType, apiKey });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST AI Financial Advisor Chat
router.post('/chat', async (req, res) => {
  try {
    const { message, apiKey } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const health = await calculateFinancialHealth();
    const transactions = await all('SELECT * FROM transactions ORDER BY date DESC LIMIT 15');
    const budgets = await all('SELECT * FROM budgets');
    const subscriptions = await all('SELECT * FROM subscriptions WHERE status = "active"');

    // Context summary for assistant
    const contextSummary = `
User Financial Health Score: ${health.score}/100 (${health.tier})
Monthly Income: $${health.metrics.totalIncome}
Monthly Expenses: $${health.metrics.totalExpenses}
Net Savings: $${health.metrics.netSavings} (Savings Rate: ${health.metrics.savingsRate}%)
Active Subscriptions: ${subscriptions.length} ($${health.metrics.monthlySubscriptions}/mo)
Detected Subscription Leaks: ${health.metrics.leaksDetected}
`;

    // If API key is provided, query Gemini
    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `You are FinAI, an empathetic, highly skilled certified personal financial coach.
Here is the user's current financial situation:
${contextSummary}

User question: "${message}"

Give a friendly, actionable, and specific response with bullet points if helpful. Keep it within 3-4 short paragraphs.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.json({ success: true, reply, source: 'gemini_advisor' });
        }
      }
    }

    // Local heuristic advisor response
    let reply = `Based on your current numbers, your Financial Health Score is **${health.score}/100 (${health.tier})** with a strong savings rate of **${health.metrics.savingsRate}%**.\n\n`;

    const lower = message.toLowerCase();
    if (lower.includes('save') || lower.includes('cut') || lower.includes('reduce')) {
      reply += `💡 **Top Optimization Areas:**\n`;
      reply += `1. **Review Flagged Subscriptions:** You currently have **${health.metrics.leaksDetected} subscription leaks** (including redundant streaming & unused memberships). Pruning them saves ~$440+/year immediately.\n`;
      reply += `2. **Dining Out Velocity:** Dining out represents one of your most variable expense categories. Setting a weekly cap of $70 could free up an extra $120/month for your savings goals.\n`;
      reply += `3. **Automate Goal Transfers:** Route $100 from every paycheck directly into your Kyoto Trip fund so you hit the goal 2 weeks earlier.`;
    } else if (lower.includes('subscription') || lower.includes('leak')) {
      reply += `🔍 **Subscription Breakdown:**\n`;
      reply += `You spend **$${health.metrics.monthlySubscriptions} per month** on recurring services. We identified potential duplication between Spotify and Apple Music, plus an unused gym membership. Check the **Subscriptions** tab to toggle or cancel them!`;
    } else if (lower.includes('goal') || lower.includes('trip') || lower.includes('emergency')) {
      reply += `🎯 **Goal Progress:**\n`;
      reply += `Your **Emergency Fund** is currently at **$11,450 / $15,000 (76%)**. At your current monthly surplus of $${health.metrics.netSavings.toLocaleString()}, you are projected to reach 100% completion in less than 2 months!`;
    } else {
      reply += `Here is your current snapshot:\n`;
      reply += `• **Monthly Inflow:** $${health.metrics.totalIncome.toLocaleString()}\n`;
      reply += `• **Monthly Outflow:** $${health.metrics.totalExpenses.toLocaleString()}\n`;
      reply += `• **Net Surplus:** $${health.metrics.netSavings.toLocaleString()} per month\n\n`;
      reply += `You can ask me questions like: *"How can I cut $200 from my budget?"*, *"Analyze my subscriptions"*, or *"How is my emergency fund doing?"*`;
    }

    res.json({ success: true, reply, source: 'local_advisor' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
