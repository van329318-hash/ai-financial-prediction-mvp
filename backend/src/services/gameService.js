const GameModel = require('../models/gameModel');
const BetModel = require('../models/betModel');
const WalletModel = require('../models/walletModel');
const AIService = require('./aiService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class GameService {
  /**
   * Start a new game round
   */
  static async startNewRound() {
    const lastRound = await GameModel.getCurrentRound();
    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    const newRound = await GameModel.createNewRound(roundNumber);
    console.log(`🎮 Round ${roundNumber} created`);

    // Get AI prediction
    await this.getAIPrediction(newRound.id);

    // Set to betting phase
    await GameModel.setRoundBetting(newRound.id);

    return newRound;
  }

  /**
   * Get prediction from AI engine
   */
  static async getAIPrediction(roundId) {
    try {
      const prediction = await AIService.getPrediction();

      const signal = await prisma.aiSignal.create({
        data: {
          roundId,
          prediction: prediction.result,
          confidence: prediction.confidence,
          patternType: prediction.patternType,
          technicalIndicators: prediction.indicators,
          modelVersion: process.env.AI_MODEL_VERSION || 'v1.0',
          processingTimeMs: prediction.processingTime
        }
      });

      await GameModel.updateRoundPrediction(roundId, prediction);

      console.log(`🤖 AI Prediction: ${prediction.result} (${prediction.confidence}% confidence)`);
      return signal;
    } catch (error) {
      console.error('AI Prediction Error:', error);
      // Fallback to 50-50
      return await GameModel.updateRoundPrediction(roundId, {
        taiProb: 50,
        xiuProb: 50,
        confidence: 50,
        result: 'RANDOM',
        patternType: 'FALLBACK'
      });
    }
  }

  /**
   * Place a bet
   */
  static async placeBet(userId, roundId, betType, amount) {
    // Validate
    if (!['TAI', 'XIU'].includes(betType.toUpperCase())) {
      throw new Error('Invalid bet type. Must be TAI or XIU');
    }

    const minBet = parseFloat(process.env.MIN_BET) || 10;
    const maxBet = parseFloat(process.env.MAX_BET) || 10000;

    if (amount < minBet || amount > maxBet) {
      throw new Error(`Bet amount must be between ${minBet} and ${maxBet}`);
    }

    // Check if round is still accepting bets
    const round = await GameModel.getCurrentRound();
    if (!round || round.id !== roundId || round.status !== 'betting') {
      throw new Error('Betting is closed for this round');
    }

    // Check if user already bet in this round
    const existingBet = await BetModel.hasUserBetInRound(userId, roundId);
    if (existingBet) {
      throw new Error('You already have a bet in this round');
    }

    // Deduct from wallet
    await WalletModel.deductBalance(userId, amount, null, `Bet ${betType}`);

    // Create bet
    const bet = await BetModel.placeBet(userId, roundId, betType, amount);

    console.log(`💰 Bet placed: User ${userId} - ${betType} - ${amount}`);

    return bet;
  }

  /**
   * Close betting for current round
   */
  static async closeBetting() {
    const round = await GameModel.getCurrentRound();
    if (!round) return null;

    await GameModel.closeRoundBetting(round.id);
    console.log(`🔒 Betting closed for round ${round.roundNumber}`);

    return round;
  }

  /**
   * Finalize round with result
   */
  static async finalizeRound(result) {
    if (!['TAI', 'XIU'].includes(result.toUpperCase())) {
      throw new Error('Invalid result. Must be TAI or XIU');
    }

    const round = await GameModel.getCurrentRound();
    if (!round) throw new Error('No active round');

    // Settle all bets
    const settledBets = await BetModel.settleRoundBets(round.id, result.toUpperCase());

    // Update user balances for wins
    for (const bet of settledBets) {
      if (bet.status === 'won' && bet.payout > 0) {
        await WalletModel.addBalance(
          bet.userId,
          bet.payout,
          bet.id,
          `Won bet round ${round.roundNumber}`
        );
      }
    }

    // Finalize round
    const finalizedRound = await GameModel.finalizeRound(round.id, result.toUpperCase());

    // Update user win rates
    const uniqueUsers = [...new Set(settledBets.map(b => b.userId))];
    for (const userId of uniqueUsers) {
      const stats = await BetModel.getUserStats(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { winRate: parseFloat(stats.winRate) }
      });
    }

    console.log(`✅ Round ${round.roundNumber} finalized: ${result} | AI correct: ${finalizedRound.isAiCorrect}`);

    return finalizedRound;
  }

  /**
   * Get round details with full information
   */
  static async getRoundDetails(roundId) {
    const round = await GameModel.getRoundStats(roundId);
    const summary = await BetModel.getRoundBettingSummary(roundId);

    return {
      ...round,
      bettingSummary: summary
    };
  }

  /**
   * Get game statistics
   */
  static async getGameStats() {
    const completedRounds = await prisma.gameRound.findMany({
      where: { status: 'completed' }
    });

    const aiCorrect = completedRounds.filter(r => r.isAiCorrect).length;
    const totalRounds = completedRounds.length;
    const aiAccuracy = totalRounds > 0 ? ((aiCorrect / totalRounds) * 100).toFixed(2) : 0;

    const totalWagered = completedRounds.reduce((sum, r) => sum + (r.totalAmountWagered || 0), 0);
    const houseProfit = completedRounds.reduce((sum, r) => sum + (r.houseProfit || 0), 0);

    return {
      totalRounds,
      completedRounds: totalRounds,
      activeRounds: (await prisma.gameRound.count({ where: { status: { not: 'completed' } } })),
      aiAccuracy,
      totalWagered,
      houseProfit,
      averageBetPerRound: totalRounds > 0 ? (totalWagered / totalRounds).toFixed(2) : 0
    };
  }
}

module.exports = GameService;
