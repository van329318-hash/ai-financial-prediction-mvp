const express = require('express');
const router = express.Router();
const WalletModel = require('../models/walletModel');
const { auth } = require('../middleware/auth');

/**
 * GET /api/wallet/balance
 * Get user's wallet balance
 */
router.get('/balance', auth, async (req, res, next) => {
  try {
    const balance = await WalletModel.getBalance(req.user.id);
    res.json({ balance });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/summary
 * Get financial summary
 */
router.get('/summary', auth, async (req, res, next) => {
  try {
    const summary = await WalletModel.getFinancialSummary(req.user.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/history
 * Get transaction history
 */
router.get('/history', auth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const history = await WalletModel.getTransactionHistory(req.user.id, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
