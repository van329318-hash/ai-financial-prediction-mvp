const express = require('express');
const router = express.Router();
const WalletModel = require('../models/walletModel');
const { auth } = require('../middleware/auth');

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const balance = await WalletModel.getBalance(req.user.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial summary
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await WalletModel.getFinancialSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await WalletModel.getTransactionHistory(req.user.id, limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
