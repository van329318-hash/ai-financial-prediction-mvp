const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const BetModel = require('../models/betModel');
const { auth } = require('../middleware/auth');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /api/user/profile
 * Get user profile with statistics
 */
router.get('/profile', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const stats = await BetModel.getUserStats(userId);

    res.json({
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt
      },
      statistics: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/bet-history
 * Get user's bet history
 */
router.get('/bet-history', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = parseInt(req.query.page) || 1;

    const bets = await prisma.bet.findMany({
      where: { userId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        round: {
          select: {
            roundNumber: true,
            actualResult: true,
            createdAt: true
          }
        }
      }
    });

    const total = await prisma.bet.count({ where: { userId } });

    res.json({
      bets,
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
 * GET /api/user/leaderboard
 * Get global leaderboard
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        walletBalance: true,
        totalWinnings: true,
        totalBets: true,
        winRate: true,
        createdAt: true
      },
      orderBy: { walletBalance: 'desc' },
      take: limit
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
