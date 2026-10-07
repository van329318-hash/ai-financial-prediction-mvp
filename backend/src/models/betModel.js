const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BetModel {
  /**
   * Place a new bet
   */
  static async placeBet(userId, roundId, betType, amount, odds = 1.97) {
    return await prisma.bet.create({
      data: {
        userId,
        roundId,
        betType: betType.toUpperCase(),
        amount: parseFloat(amount),
        odds,
        status: 'pending'
      }
    });
  }

  /**
   * Settle a single bet
   */
  static async settleBet(betId, result) {
    const bet = await prisma.bet.findUnique({ where: { id: betId } });
    
    if (!bet) throw new Error('Bet not found');
    if (bet.status !== 'pending') throw new Error('Bet already settled');

    const isWin = bet.betType === result;
    const payout = isWin ? bet.amount * bet.odds : 0;
    const profit = payout - bet.amount;

    return await prisma.bet.update({
      where: { id: betId },
      data: {
        status: isWin ? 'won' : 'lost',
        payout,
        profit,
        settledAt: new Date()
      }
    });
  }

  /**
   * Settle all bets for a round
   */
  static async settleRoundBets(roundId, result) {
    const bets = await prisma.bet.findMany({
      where: { roundId, status: 'pending' }
    });

    const settledBets = [];
    for (const bet of bets) {
      const settled = await this.settleBet(bet.id, result);
      settledBets.push(settled);
    }

    return settledBets;
  }

  /**
   * Get user's bet history
   */
  static async getUserBetHistory(userId, limit = 50) {
    return await prisma.bet.findMany({
      where: { userId },
      take: -limit,
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
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId) {
    const bets = await prisma.bet.findMany({
      where: { userId, status: { in: ['won', 'lost'] } }
    });

    const totalBets = bets.length;
    const wonBets = bets.filter(b => b.status === 'won').length;
    const lostBets = bets.filter(b => b.status === 'lost').length;
    const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
    const totalPayout = bets.reduce((sum, b) => sum + (b.payout || 0), 0);
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
    const profit = totalPayout - totalAmount;

    return {
      totalBets,
      wonBets,
      lostBets,
      winRate: winRate.toFixed(2),
      totalAmount,
      totalPayout,
      profit,
      roi: totalAmount > 0 ? ((profit / totalAmount) * 100).toFixed(2) : 0
    };
  }

  /**
   * Check if user has bet in current round
   */
  static async hasUserBetInRound(userId, roundId) {
    const bet = await prisma.bet.findFirst({
      where: { userId, roundId, status: 'pending' }
    });
    return !!bet;
  }

  /**
   * Get round betting summary
   */
  static async getRoundBettingSummary(roundId) {
    const bets = await prisma.bet.findMany({
      where: { roundId, status: 'pending' }
    });

    const taiBets = bets.filter(b => b.betType === 'TAI');
    const xiuBets = bets.filter(b => b.betType === 'XIU');

    return {
      totalBets: bets.length,
      taiBets: taiBets.length,
      xiuBets: xiuBets.length,
      taiAmount: taiBets.reduce((sum, b) => sum + b.amount, 0),
      xiuAmount: xiuBets.reduce((sum, b) => sum + b.amount, 0),
      totalAmount: bets.reduce((sum, b) => sum + b.amount, 0),
      betRatio: taiBets.length > 0 ? (xiuBets.length / taiBets.length).toFixed(2) : 0
    };
  }
}

module.exports = BetModel;
