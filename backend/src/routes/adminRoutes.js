const express = require('express');
const router = express.Router();
const GameService = require('../services/gameService');
const AIService = require('../services/aiService');
const prisma = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * POST /api/admin/start-round
 * Admin: Start new game round
 */
router.post('/start-round', auth, adminOnly, async (req, res, next) => {
  try {
    const round = await GameService.startNewRound(req.app.locals.broadcast);
    
    logger.warn(`🎲 Admin started new round: #${round.roundNumber}`);
    
    res.json({ 
      message: 'New round started', 
      round 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/finalize-round
 * Admin: Finalize current round with result
 */
router.post('/finalize-round', auth, adminOnly, async (req, res, next) => {
  try {
    const { result } = req.body;
    
    if (!['TAI', 'XIU'].includes(result?.toUpperCase())) {
      throw new ValidationError('Result must be TAI or XIU');
    }

    const round = await GameService.finalizeRound(result.toUpperCase(), req.app.locals.broadcast);
    
    logger.warn(`✅ Admin finalized round: #${round.roundNumber} - Result: ${result}`);
    
    res.json({ 
      message: 'Round finalized', 
      round 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/game-stats
 * Admin: Get detailed game statistics
 */
router.get('/game-stats', auth, adminOnly, async (req, res, next) => {
  try {
    const totalRounds = await prisma.gameRound.count();
    const completedRounds = await prisma.gameRound.count({ 
      where: { status: 'completed' } 
    });
    const totalUsers = await prisma.user.count();
    const totalBets = await prisma.bet.count();
    const totalWagered = await prisma.bet.aggregate({
      _sum: { amount: true }
    });

    const aiCorrect = await prisma.gameRound.count({
      where: { isAiCorrect: true }
    });

    const stats = {
      rounds: {
        total: totalRounds,
        completed: completedRounds,
        active: totalRounds - completedRounds,
        aiAccuracy: completedRounds > 0 ? ((aiCorrect / completedRounds) * 100).toFixed(2) : 0
      },
      users: totalUsers,
      bets: {
        total: totalBets,
        totalWagered: totalWagered._sum.amount || 0
      }
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Admin: List all users with stats
 */
router.get('/users', auth, adminOnly, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = parseInt(req.query.page) || 1;

    const users = await prisma.user.findMany({
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        username: true,
        email: true,
        walletBalance: true,
        totalBets: true,
        totalWinnings: true,
        winRate: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count();

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/user/:userId/reset-balance
 * Admin: Reset user balance
 */
router.post('/user/:userId/reset-balance', auth, adminOnly, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const initialBalance = amount || parseFloat(process.env.INITIAL_BALANCE) || 1000;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: initialBalance,
        totalBets: 0,
        totalWinnings: 0,
        winRate: 0
      }
    });

    logger.warn(`⚠️  Admin reset balance for user ${user.username} to ${initialBalance}`);

    res.json({
      message: 'Balance reset successfully',
      user: {
        id: user.id,
        username: user.username,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/ai/metrics
 * Admin: Get AI model metrics
 */
router.get('/ai/metrics', auth, adminOnly, async (req, res, next) => {
  try {
    const metrics = await AIService.getModelMetrics();
    res.json(metrics || { status: 'AI Engine unavailable' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
