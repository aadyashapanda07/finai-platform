const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

// GET all subscriptions with summary metrics
router.get('/', async (req, res) => {
  try {
    const subscriptions = await all('SELECT * FROM subscriptions ORDER BY is_leak DESC, amount DESC');
    
    let monthlyTotal = 0;
    let annualTotal = 0;
    let leakSavingsPotential = 0;
    let activeCount = 0;

    subscriptions.forEach(s => {
      if (s.status === 'active') {
        activeCount++;
        const mCost = s.billing_cycle === 'yearly' ? s.amount / 12 : s.amount;
        monthlyTotal += mCost;
        annualTotal += mCost * 12;

        if (s.is_leak) {
          leakSavingsPotential += mCost * 12;
        }
      }
    });

    res.json({
      success: true,
      data: subscriptions,
      stats: {
        activeCount,
        monthlyTotal: Math.round(monthlyTotal * 100) / 100,
        annualTotal: Math.round(annualTotal * 100) / 100,
        leakSavingsPotential: Math.round(leakSavingsPotential * 100) / 100,
        leakCount: subscriptions.filter(s => s.is_leak === 1 && s.status === 'active').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new subscription
router.post('/', async (req, res) => {
  try {
    const {
      name,
      amount,
      billing_cycle = 'monthly',
      category = 'Entertainment & Leisure',
      next_billing_date = new Date().toISOString().split('T')[0],
      notes = ''
    } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ success: false, error: 'Name and amount are required' });
    }

    // Auto-detect potential leak (e.g. duplicate audio, video or high price)
    let is_leak = 0;
    let leak_reason = null;

    const lowerName = name.toLowerCase();
    const existing = await all('SELECT name, amount FROM subscriptions WHERE status = "active"');
    
    const streamingNames = ['spotify', 'apple music', 'tidal', 'youtube music', 'amazon music'];
    const hasExistingStreaming = existing.some(e => streamingNames.some(s => e.name.toLowerCase().includes(s)));
    if (streamingNames.some(s => lowerName.includes(s)) && hasExistingStreaming) {
      is_leak = 1;
      leak_reason = 'Duplicate audio streaming service detected.';
    }

    const id = uuidv4();
    await run(
      `INSERT INTO subscriptions (id, name, amount, billing_cycle, category, next_billing_date, status, is_leak, leak_reason, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [id, name, parseFloat(amount), billing_cycle, category, next_billing_date, is_leak, leak_reason, notes]
    );

    const created = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH subscription status (e.g. cancel, pause, active)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await run('UPDATE subscriptions SET status = ? WHERE id = ?', [status, id]);
    const updated = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH dismiss leak
router.patch('/:id/dismiss-leak', async (req, res) => {
  try {
    const { id } = req.params;
    await run('UPDATE subscriptions SET is_leak = 0, leak_reason = NULL WHERE id = ?', [id]);
    const updated = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update subscription
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, billing_cycle, category, next_billing_date, notes } = req.body;

    await run(
      `UPDATE subscriptions
       SET name = COALESCE(?, name),
           amount = COALESCE(?, amount),
           billing_cycle = COALESCE(?, billing_cycle),
           category = COALESCE(?, category),
           next_billing_date = COALESCE(?, next_billing_date),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [name || null, amount !== undefined ? parseFloat(amount) : null, billing_cycle || null, category || null, next_billing_date || null, notes !== undefined ? notes : null, id]
    );

    const updated = await get('SELECT * FROM subscriptions WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE subscription
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM subscriptions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Subscription removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
