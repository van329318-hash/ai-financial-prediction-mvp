const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GameModel {
  /**
   * Get current active round
   */
  static async getCurrentRound() {
    return await prisma.gameRound.findFirst({
      where: { status: { in: ['pending', 'betting', 'processing'] } },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Create new game round
   */
  static async createNewRound(roundNumber) {
    return await prisma.gameRound.create({
      data: {
        roundNumber,
        status: 'pending',
        predictionTaiProb: 50,
        predictionXiuProb: 50,
        aiConfidence: 50
      }
    });
  }

  /**
   * Update round with AI prediction
   */
  static async updateRoundPrediction(roundId, prediction) {
    return await prisma.gameRound.update({
      where: { id: roundId },
      data: {
        predictionTaiProb: prediction.taiProb,
        predictionXiuProb: prediction.xiuProb,
        aiConfidence: prediction.confidence,
        predictionResult: prediction.result,
        patternType: prediction.patternType,
        indicators: prediction.indicators
      }
    });
  }

  /**
   * Set round to betting phase
   */
  static async setRoundBetting(roundId) {
    return await prisma.gameRound.update({
      where: { id: roundId },
      data: {
        status: 'betting',
        startedAt: new Date()
      }
    });
  }

  /**
   * Close betting for a round
   */
  static async closeRoundBetting(roundId) {
    return await prisma.gameRound.update({
      where: { id: roundId },
      data: { status: 'processing' }
    });
  }

  /**
   * Finalize round with result
   */
  static async finalizeRound(roundId, result) {
    const round = await prisma.gameRound.findUnique({
      where: { id: roundId },
      include: { bets: true }
    });

    const isAiCorrect = round.predictionResult === result;

    // Calculate house profit
    const winningBets = round.bets.filter(b => b.betType === result && b.status === 'pending');
    const losingBets = round.bets.filter(b => b.betType !== result && b.status === 'pending');

    const totalWinnings = winningBets.reduce((sum, b) => sum + (b.amount * b.odds), 0);
    const totalLosings = losingBets.reduce((sum, b) => sum + b.amount, 0);
    const houseProfit = totalLosings - totalWinnings;

    return await prisma.gameRound.update({
      where: { id: roundId },
      data: {
        status: 'completed',
        actualResult: result,
        isAiCorrect,
        houseProfit,
        closedAt: new Date(),
        resultAnnouncedAt: new Date()
      }
    });
  }

  /**
   * Get round statistics
   */
  static async getRoundStats(roundId) {
    return await prisma.gameRound.findUnique({
      where: { id: roundId },
      include: {
        bets: {
          select: {
            betType: true,
            amount: true,
            status: true,
            payout: true
          }
        },
        aiSignals: true
      }
    });
  }

  /**
   * Get recent rounds (for dashboard)
   */
  static async getRecentRounds(limit = 10) {
    return await prisma.gameRound.findMany({
      take: -limit,
      orderBy: { roundNumber: 'desc' },
      include: {
        bets: { select: { betType: true, amount: true, status: true } },
        aiSignals: { take: 1, orderBy: { createdAt: 'desc' } }
      }
    });
  }
}

module.exports = GameModel;
