const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('../utils/uuid');
const { run, get, all } = require('../db/database');
const { calculateFinancialHealth } = require('../services/healthAnalytics');

// GET financial health score, pillars, and projections
router.get('/health', async (req, res) => {
  try {
    const health = await calculateFinancialHealth();
    res.json({ success: true, data: health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all active insights
router.get('/', async (req, res) => {
  try {
    const insights = await all('SELECT * FROM insights WHERE dismissed = 0 ORDER BY created_at DESC');
    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DISMISS all insights
router.patch('/dismiss-all', async (req, res) => {
  try {
    await run('UPDATE insights SET dismissed = 1');
    res.json({ success: true, message: 'All insights dismissed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DISMISS insight
router.patch('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    await run('UPDATE insights SET dismissed = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Insight dismissed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST generate fresh live insights
router.post('/generate', async (req, res) => {
  try {
    const health = await calculateFinancialHealth();
    const newInsights = [];

    // Check for budget alerts
    const budgets = await all('SELECT * FROM budgets');
    const expenses = await all(
      'SELECT category, SUM(amount) as spent FROM transactions WHERE type = "expense" GROUP BY category'
    );
    const spentMap = {};
    expenses.forEach(e => { spentMap[e.category] = e.spent; });

    budgets.forEach(b => {
      const spent = spentMap[b.category] || 0;
      if (spent > b.monthly_limit) {
        newInsights.push({
          id: uuidv4(),
          type: 'budget_alert',
          title: `Budget Exceeded: ${b.category}`,
          message: `You've spent $${spent.toFixed(2)} of your $${b.monthly_limit.toFixed(2)} monthly limit. Consider curbing spending in this category.`,
          severity: 'warning',
          action_label: 'Adjust Budget',
          action_payload: '/budgets'
        });
      }
    });

    // Check for high savings rate
    if (health.metrics.savingsRate >= 30) {
      newInsights.push({
        id: uuidv4(),
        type: 'savings_tip',
        title: `Outstanding Savings Velocity: ${health.metrics.savingsRate}%`,
        message: `Your savings rate is in the top 5% of financial health benchmarks. Consider deploying excess cash to high-yield or goal funds.`,
        severity: 'success',
        action_label: 'Allocate to Goals',
        action_payload: '/goals'
      });
    }

    for (const ins of newInsights) {
      // Check if duplicate title exists in last 24h
      const existing = await get('SELECT id FROM insights WHERE title = ? AND dismissed = 0', [ins.title]);
      if (!existing) {
        await run(
          `INSERT INTO insights (id, type, title, message, severity, action_label, action_payload)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ins.id, ins.type, ins.title, ins.message, ins.severity, ins.action_label, ins.action_payload]
        );
      }
    }

    const updated = await all('SELECT * FROM insights WHERE dismissed = 0 ORDER BY created_at DESC');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
