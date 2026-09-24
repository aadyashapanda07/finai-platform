const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('../utils/uuid');
const { run, get, all } = require('../db/database');

// GET budgets with live spent & remaining calculations
router.get('/', async (req, res) => {
  try {
    const budgets = await all('SELECT * FROM budgets ORDER BY monthly_limit DESC');
    
    // Calculate current month's spending per category
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const expenses = await all(
      'SELECT category, SUM(amount) as spent FROM transactions WHERE type = "expense" AND date LIKE ? GROUP BY category',
      [`${currentMonthStr}%`]
    );

    const spentMap = {};
    expenses.forEach(e => {
      spentMap[e.category] = e.spent;
    });

    const enriched = budgets.map(b => {
      const spent = spentMap[b.category] || 0;
      const limit = b.monthly_limit;
      const remaining = Math.max(0, limit - spent);
      const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const isOver = spent > limit;
      const isWarning = percentUsed >= (b.alert_threshold || 80);

      return {
        ...b,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentUsed,
        isOver,
        isWarning
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new budget
router.post('/', async (req, res) => {
  try {
    const { category, monthly_limit, alert_threshold = 80 } = req.body;
    if (!category || !monthly_limit) {
      return res.status(400).json({ success: false, error: 'Category and monthly_limit are required' });
    }

    const id = uuidv4();
    await run(
      `INSERT INTO budgets (id, category, monthly_limit, alert_threshold)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(category) DO UPDATE SET monthly_limit=excluded.monthly_limit, alert_threshold=excluded.alert_threshold`,
      [id, category, parseFloat(monthly_limit), parseFloat(alert_threshold)]
    );

    const updated = await get('SELECT * FROM budgets WHERE category = ?', [category]);
    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update budget
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, monthly_limit, alert_threshold } = req.body;

    await run(
      `UPDATE budgets 
       SET category = COALESCE(?, category),
           monthly_limit = COALESCE(?, monthly_limit),
           alert_threshold = COALESCE(?, alert_threshold)
       WHERE id = ?`,
      [category || null, monthly_limit !== undefined ? parseFloat(monthly_limit) : null, alert_threshold !== undefined ? parseFloat(alert_threshold) : null, id]
    );

    const updated = await get('SELECT * FROM budgets WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH quick-adjust budget limit (e.g. +$50 / -$50)
router.patch('/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body; // e.g. +50 or -50
    const current = await get('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ success: false, error: 'Budget not found' });

    const newLimit = Math.max(25, current.monthly_limit + parseFloat(delta || 0));
    await run('UPDATE budgets SET monthly_limit = ? WHERE id = ?', [newLimit, id]);

    const updated = await get('SELECT * FROM budgets WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE budget
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM budgets WHERE id = ?', [id]);
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
