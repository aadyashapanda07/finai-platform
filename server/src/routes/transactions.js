const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

// GET all transactions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, category, search, limit = 100 } = req.query;
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (merchant LIKE ? OR description LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY date DESC, created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const transactions = await all(sql, params);
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET summary & analytics
router.get('/summary', async (req, res) => {
  try {
    const rows = await all('SELECT type, category, amount, date FROM transactions');
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};
    const monthlyTotals = {};

    rows.forEach((r) => {
      const monthKey = r.date ? r.date.substring(0, 7) : 'Unknown';
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }

      if (r.type === 'income') {
        totalIncome += r.amount;
        monthlyTotals[monthKey].income += r.amount;
      } else {
        totalExpense += r.amount;
        monthlyTotals[monthKey].expense += r.amount;
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: Math.round(amount * 100) / 100
    })).sort((a, b) => b.value - a.value);

    const monthlyTrends = Object.values(monthlyTotals).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
        categoryBreakdown,
        monthlyTrends
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new transaction
router.post('/', async (req, res) => {
  try {
    const {
      amount,
      type = 'expense',
      category = 'General',
      merchant = 'General',
      description = '',
      date = new Date().toISOString().split('T')[0],
      payment_method = 'Card',
      is_recurring = 0,
      tags = ''
    } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    const id = uuidv4();
    await run(
      `INSERT INTO transactions (id, amount, type, category, merchant, description, date, payment_method, is_recurring, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, parseFloat(amount), type, category, merchant, description, date, payment_method, is_recurring ? 1 : 0, tags]
    );

    const newTx = await get('SELECT * FROM transactions WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: newTx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      type,
      category,
      merchant,
      description,
      date,
      payment_method,
      tags
    } = req.body;

    await run(
      `UPDATE transactions 
       SET amount = COALESCE(?, amount),
           type = COALESCE(?, type),
           category = COALESCE(?, category),
           merchant = COALESCE(?, merchant),
           description = COALESCE(?, description),
           date = COALESCE(?, date),
           payment_method = COALESCE(?, payment_method),
           tags = COALESCE(?, tags)
       WHERE id = ?`,
      [
        amount !== undefined ? parseFloat(amount) : null,
        type || null,
        category || null,
        merchant || null,
        description !== undefined ? description : null,
        date || null,
        payment_method || null,
        tags !== undefined ? tags : null,
        id
      ]
    );

    const updated = await get('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
