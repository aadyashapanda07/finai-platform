const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

// GET all goals with progress percentages and projected days remaining
router.get('/', async (req, res) => {
  try {
    const goals = await all('SELECT * FROM savings_goals ORDER BY status ASC, created_at DESC');
    
    const enriched = goals.map(g => {
      const progress = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
      const remainingAmount = Math.max(0, g.target_amount - g.current_amount);
      
      let daysRemaining = null;
      if (g.target_date) {
        const target = new Date(g.target_date);
        const today = new Date();
        const diffMs = target - today;
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        ...g,
        progress,
        remainingAmount,
        daysRemaining
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new goal
router.post('/', async (req, res) => {
  try {
    const {
      name,
      target_amount,
      current_amount = 0,
      target_date = null,
      category = 'General',
      icon = 'target',
      color = 'emerald'
    } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ success: false, error: 'Name and target_amount are required' });
    }

    const id = uuidv4();
    await run(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, target_date, category, icon, color, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, name, parseFloat(target_amount), parseFloat(current_amount || 0), target_date, category, icon, color]
    );

    const created = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST contribute towards a goal
router.post('/:id/contribute', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid contribution amount is required' });
    }

    const goal = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    const newAmount = goal.current_amount + parseFloat(amount);
    const newStatus = newAmount >= goal.target_amount ? 'completed' : goal.status;

    await run('UPDATE savings_goals SET current_amount = ?, status = ? WHERE id = ?', [newAmount, newStatus, id]);

    // Also record transaction as savings transfer
    const txId = uuidv4();
    await run(
      `INSERT INTO transactions (id, amount, type, category, merchant, description, date, payment_method, tags)
       VALUES (?, ?, 'expense', 'Savings & Goals', ?, ?, ?, 'Internal Transfer', 'savings,goal')`,
      [
        txId,
        parseFloat(amount),
        `Goal: ${goal.name}`,
        `Contribution toward ${goal.name}`,
        new Date().toISOString().split('T')[0]
      ]
    );

    const updatedGoal = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    res.json({
      success: true,
      data: updatedGoal,
      completed: newAmount >= goal.target_amount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST withdraw from a goal
router.post('/:id/withdraw', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid withdrawal amount is required' });
    }

    const goal = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    const withdrawVal = parseFloat(amount);
    const newAmount = Math.max(0, goal.current_amount - withdrawVal);
    const newStatus = 'active';

    await run('UPDATE savings_goals SET current_amount = ?, status = ? WHERE id = ?', [newAmount, newStatus, id]);

    // Record as income/savings transfer back
    const txId = uuidv4();
    await run(
      `INSERT INTO transactions (id, amount, type, category, merchant, description, date, payment_method, tags)
       VALUES (?, ?, 'income', 'Savings & Goals', ?, ?, ?, 'Internal Transfer', 'savings,withdrawal')`,
      [
        txId,
        withdrawVal,
        `Withdrawal: ${goal.name}`,
        `Withdrawal from ${goal.name}`,
        new Date().toISOString().split('T')[0]
      ]
    );

    const updatedGoal = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    res.json({ success: true, data: updatedGoal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update goal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_amount, current_amount, target_date, category, icon, color, status } = req.body;

    await run(
      `UPDATE savings_goals
       SET name = COALESCE(?, name),
           target_amount = COALESCE(?, target_amount),
           current_amount = COALESCE(?, current_amount),
           target_date = COALESCE(?, target_date),
           category = COALESCE(?, category),
           icon = COALESCE(?, icon),
           color = COALESCE(?, color),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name || null,
        target_amount !== undefined ? parseFloat(target_amount) : null,
        current_amount !== undefined ? parseFloat(current_amount) : null,
        target_date !== undefined ? target_date : null,
        category || null,
        icon || null,
        color || null,
        status || null,
        id
      ]
    );

    const updated = await get('SELECT * FROM savings_goals WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM savings_goals WHERE id = ?', [id]);
    res.json({ success: true, message: 'Goal removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
