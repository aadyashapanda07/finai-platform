const express = require('express');
const router = express.Router();
const { run, all } = require('../db/database');
const { seedData } = require('../db/seed');

// POST reseed sample data
router.post('/reseed', async (req, res) => {
  try {
    // Clear existing tables
    await run('DELETE FROM transactions');
    await run('DELETE FROM budgets');
    await run('DELETE FROM subscriptions');
    await run('DELETE FROM savings_goals');
    await run('DELETE FROM insights');
    await run('DELETE FROM assets');
    await run('DELETE FROM liabilities');

    // Run seed
    await seedData();
    res.json({ success: true, message: 'Platform successfully re-seeded with realistic financial sample data.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST clear all data
router.post('/clear', async (req, res) => {
  try {
    await run('DELETE FROM transactions');
    await run('DELETE FROM budgets');
    await run('DELETE FROM subscriptions');
    await run('DELETE FROM savings_goals');
    await run('DELETE FROM insights');
    await run('DELETE FROM assets');
    await run('DELETE FROM liabilities');

    res.json({ success: true, message: 'All ledger data cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
