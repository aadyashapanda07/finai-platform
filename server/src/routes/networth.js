const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('../utils/uuid');
const { run, get, all } = require('../db/database');

// GET full Net Worth overview
router.get('/', async (req, res) => {
  try {
    const assets = await all('SELECT * FROM assets ORDER BY value DESC');
    const liabilities = await all('SELECT * FROM liabilities ORDER BY amount DESC');

    const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.value || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    const debtToAssetRatio = totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0;

    // Group assets by type
    const allocationMap = {};
    assets.forEach(a => {
      const typeKey = a.type || 'other';
      allocationMap[typeKey] = (allocationMap[typeKey] || 0) + parseFloat(a.value || 0);
    });

    const assetAllocation = Object.entries(allocationMap).map(([type, value]) => ({
      type: type.replace('_', ' ').toUpperCase(),
      value: Math.round(value * 100) / 100,
      percentage: totalAssets > 0 ? Math.round((value / totalAssets) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        totalAssets: Math.round(totalAssets * 100) / 100,
        totalLiabilities: Math.round(totalLiabilities * 100) / 100,
        netWorth: Math.round(netWorth * 100) / 100,
        debtToAssetRatio,
        assets,
        liabilities,
        assetAllocation
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add asset
router.post('/asset', async (req, res) => {
  try {
    const { name, type = 'cash', value, institution = '', notes = '' } = req.body;
    if (!name || value === undefined || isNaN(parseFloat(value))) {
      return res.status(400).json({ success: false, error: 'Name and valid value are required' });
    }

    const id = uuidv4();
    await run(
      `INSERT INTO assets (id, name, type, value, institution, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, type, parseFloat(value), institution, notes]
    );

    const created = await get('SELECT * FROM assets WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update asset
router.put('/asset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value, institution, notes } = req.body;

    await run(
      `UPDATE assets
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           value = COALESCE(?, value),
           institution = COALESCE(?, institution),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [name || null, type || null, value !== undefined ? parseFloat(value) : null, institution || null, notes !== undefined ? notes : null, id]
    );

    const updated = await get('SELECT * FROM assets WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE asset
router.delete('/asset/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM assets WHERE id = ?', [id]);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add liability
router.post('/liability', async (req, res) => {
  try {
    const { name, type = 'credit_card', amount, interest_rate = 0, min_payment = 0, institution = '' } = req.body;
    if (!name || amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ success: false, error: 'Name and valid amount are required' });
    }

    const id = uuidv4();
    await run(
      `INSERT INTO liabilities (id, name, type, amount, interest_rate, min_payment, institution)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type, parseFloat(amount), parseFloat(interest_rate || 0), parseFloat(min_payment || 0), institution]
    );

    const created = await get('SELECT * FROM liabilities WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update liability
router.put('/liability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, amount, interest_rate, min_payment, institution } = req.body;

    await run(
      `UPDATE liabilities
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           amount = COALESCE(?, amount),
           interest_rate = COALESCE(?, interest_rate),
           min_payment = COALESCE(?, min_payment),
           institution = COALESCE(?, institution)
       WHERE id = ?`,
      [
        name || null,
        type || null,
        amount !== undefined ? parseFloat(amount) : null,
        interest_rate !== undefined ? parseFloat(interest_rate) : null,
        min_payment !== undefined ? parseFloat(min_payment) : null,
        institution || null,
        id
      ]
    );

    const updated = await get('SELECT * FROM liabilities WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE liability
router.delete('/liability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM liabilities WHERE id = ?', [id]);
    res.json({ success: true, message: 'Liability deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
