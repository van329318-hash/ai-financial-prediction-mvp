const GameService = require('../services/gameService');
const BetModel = require('../models/betModel');
const GameModel = require('../models/gameModel');

class GameController {
  /**
   * Get current game round info
   */
  static async getCurrentRound(req, res) {
    try {
      const round = await GameModel.getCurrentRound();
      if (!round) {
        return res.status(404).json({ error: 'No active round' });
      }

      res.json(round);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Place a bet
   */
  static async placeBet(req, res) {
    try {
      const { roundId, betType, amount } = req.body;
      const userId = req.user.id;

      if (!roundId || !betType || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const bet = await GameService.placeBet(userId, roundId, betType, amount);

      res.json({
        message: 'Bet placed successfully',
        bet
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get round details
   */
  static async getRoundDetails(req, res) {
    try {
      const { roundId } = req.params;
      const details = await GameService.getRoundDetails(roundId);
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get recent rounds
   */
  static async getRecentRounds(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const rounds = await GameModel.getRecentRounds(limit);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get game statistics
   */
  static async getGameStats(req, res) {
    try {
      const stats = await GameService.getGameStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Admin: Start new round
   */
  static async adminStartRound(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const round = await GameService.startNewRound();
      res.json({ message: 'New round started', round });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Admin: Finalize round
   */
  static async adminFinalizeRound(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { result } = req.body;
      if (!result) {
        return res.status(400).json({ error: 'Result is required' });
      }

      const round = await GameService.finalizeRound(result);
      res.json({ message: 'Round finalized', round });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Initialize automatic game loop
   */
  static initializeGameLoop() {
    const roundDuration = (process.env.GAME_ROUND_DURATION || 60) * 1000;
    const bettingWindow = (process.env.BETTING_WINDOW || 50) * 1000;

    console.log(`🎮 Game loop initialized: ${roundDuration / 1000}s rounds`);

    // Start first round
    GameService.startNewRound().catch(console.error);

    setInterval(() => {
      // Close betting
      GameService.closeBetting().catch(console.error);

      // After betting closes, wait then finalize
      setTimeout(() => {
        // Randomly choose TAI or XIU for demo
        const result = Math.random() > 0.5 ? 'TAI' : 'XIU';
        GameService.finalizeRound(result)
          .then(() => GameService.startNewRound())
          .catch(console.error);
      }, 5000);
    }, roundDuration);
  }
}

module.exports = GameController;
