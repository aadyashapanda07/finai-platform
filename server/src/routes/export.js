const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('../utils/uuid');
const { all, run } = require('../db/database');

// GET export transactions as CSV
router.get('/csv', async (req, res) => {
  try {
    const transactions = await all('SELECT * FROM transactions ORDER BY date DESC');

    const headers = ['Date', 'Type', 'Category', 'Merchant', 'Description', 'Amount', 'PaymentMethod', 'Recurring', 'Tags'];
    const rows = transactions.map(t => [
      `"${t.date || ''}"`,
      `"${t.type || 'expense'}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.payment_method || '').replace(/"/g, '""')}"`,
      t.is_recurring ? 'Yes' : 'No',
      `"${(t.tags || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="finai_transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET export full system backup as JSON
router.get('/json', async (req, res) => {
  try {
    const [transactions, budgets, subscriptions, goals, assets, liabilities] = await Promise.all([
      all('SELECT * FROM transactions'),
      all('SELECT * FROM budgets'),
      all('SELECT * FROM subscriptions'),
      all('SELECT * FROM savings_goals'),
      all('SELECT * FROM assets'),
      all('SELECT * FROM liabilities')
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      platform: 'FinAI',
      version: '2.0.0',
      data: {
        transactions,
        budgets,
        subscriptions,
        goals,
        assets,
        liabilities
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="finai_backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST import CSV or JSON data
router.post('/import', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of transaction items is required' });
    }

    let importedCount = 0;
    for (const item of items) {
      if (item.amount && !isNaN(parseFloat(item.amount))) {
        const id = uuidv4();
        await run(
          `INSERT INTO transactions (id, amount, type, category, merchant, description, date, payment_method, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            parseFloat(item.amount),
            item.type || 'expense',
            item.category || 'General',
            item.merchant || 'Imported Payee',
            item.description || 'Imported via CSV/JSON',
            item.date || new Date().toISOString().split('T')[0],
            item.payment_method || 'Import',
            'imported'
          ]
        );
        importedCount++;
      }
    }

    res.json({ success: true, imported: importedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
