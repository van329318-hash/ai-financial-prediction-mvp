const express = require('express');
const router = express.Router();
const GameService = require('../services/gameService');
const GameModel = require('../models/gameModel');
const BetModel = require('../models/betModel');
const { auth } = require('../middleware/auth');
const { validateBet } = require('../validators/schemas');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * GET /api/game/current-round
 * Get current active game round
 */
router.get('/current-round', async (req, res, next) => {
  try {
    const round = await GameModel.getCurrentRound();
    if (!round) {
      return res.status(404).json({ error: 'No active round' });
    }

    res.json(round);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/game/bet
 * Place a bet
 */
router.post('/bet', auth, async (req, res, next) => {
  try {
    const { error, value } = validateBet(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { roundId, betType, amount } = value;
    const userId = req.user.id;

    const bet = await GameService.placeBet(userId, roundId, betType, amount);

    // Broadcast betting update
    const summary = await BetModel.getRoundBettingSummary(roundId);
    req.app.locals.broadcast.bettingUpdate(roundId, summary);

    logger.info(`💰 Bet placed: User ${userId} - ${betType} - ${amount}`);

    res.json({
      message: 'Bet placed successfully',
      bet
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/game/round/:roundId
 * Get round details with betting info
 */
router.get('/round/:roundId', async (req, res, next) => {
  try {
    const { roundId } = req.params;
    const details = await GameService.getRoundDetails(roundId);
    
    if (!details) {
      return res.status(404).json({ error: 'Round not found' });
    }

    res.json(details);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/game/recent-rounds
 * Get recent completed rounds
 */
router.get('/recent-rounds', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const rounds = await GameModel.getRecentRounds(limit);
    res.json(rounds);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/game/stats
 * Get game statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await GameService.getGameStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
