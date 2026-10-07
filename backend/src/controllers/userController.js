const { PrismaClient } = require('@prisma/client');
const BetModel = require('../models/betModel');
const WalletModel = require('../models/walletModel');
const prisma = new PrismaClient();

class UserController {
  /**
   * Get user profile with stats
   */
  static async getUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's bet history
   */
  static async getBetHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
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
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;

      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          username: true,
          walletBalance: true,
          totalWinnings: true,
          totalBets: true,
          winRate: true
        },
        orderBy: { walletBalance: 'desc' },
        take: limit
      });

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
