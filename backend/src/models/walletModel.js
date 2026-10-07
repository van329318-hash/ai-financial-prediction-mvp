const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WalletModel {
  /**
   * Get user wallet balance
   */
  static async getBalance(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });
    return user?.walletBalance || 0;
  }

  /**
   * Deduct amount from wallet (for betting)
   */
  static async deductBalance(userId, amount, betId, description = 'Bet placed') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });

    if (!user || user.walletBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = user.walletBalance - amount;

    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: newBalance,
        totalBets: { increment: amount }
      }
    });

    // Log transaction
    await prisma.walletTransaction.create({
      data: {
        userId,
        betId,
        transactionType: 'bet',
        amount,
        balanceBefore: user.walletBalance,
        balanceAfter: newBalance,
        status: 'completed',
        description
      }
    });

    return newBalance;
  }

  /**
   * Add amount to wallet (for winnings)
   */
  static async addBalance(userId, amount, betId, description = 'Bet won') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });

    const newBalance = (user?.walletBalance || 0) + amount;

    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: newBalance,
        totalWinnings: { increment: amount }
      }
    });

    // Log transaction
    await prisma.walletTransaction.create({
      data: {
        userId,
        betId,
        transactionType: 'win',
        amount,
        balanceBefore: user?.walletBalance || 0,
        balanceAfter: newBalance,
        status: 'completed',
        description
      }
    });

    return newBalance;
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(userId, limit = 50) {
    return await prisma.walletTransaction.findMany({
      where: { userId },
      take: -limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get user financial summary
   */
  static async getFinancialSummary(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        totalBets: true,
        totalWinnings: true,
        winRate: true
      }
    });

    return {
      balance: user?.walletBalance || 0,
      totalBets: user?.totalBets || 0,
      totalWinnings: user?.totalWinnings || 0,
      profit: (user?.totalWinnings || 0) - (user?.totalBets || 0),
      winRate: user?.winRate || 0
    };
  }

  /**
   * Reset user balance to initial amount (admin only)
   */
  static async resetBalance(userId, amount = 1000) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: amount,
        totalBets: 0,
        totalWinnings: 0,
        winRate: 0
      }
    });
  }
}

module.module = WalletModel;
