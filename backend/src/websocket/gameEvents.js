const GameService = require('../services/gameService');
const BetModel = require('../models/betModel');
const WalletModel = require('../models/walletModel');

function setupGameEvents(io) {
  const gameRoom = 'game-room';
  let gameState = {
    currentRound: null,
    roundTimer: 60,
    bettingActive: false
  };

  /**
   * Broadcast events to all connected clients
   */
  const broadcast = {
    roundStarted: (round) => {
      gameState.currentRound = round;
      gameState.bettingActive = true;
      gameState.roundTimer = 60;
      io.to(gameRoom).emit('round:started', {
        round,
        bettingActive: true,
        timer: 60
      });
    },

    bettingUpdate: (roundId, summary) => {
      io.to(gameRoom).emit('betting:update', {
        roundId,
        summary
      });
    },

    bettingClosed: (roundId) => {
      gameState.bettingActive = false;
      io.to(gameRoom).emit('betting:closed', {
        roundId,
        message: 'Betting window closed'
      });
    },

    roundResult: (result) => {
      gameState.currentRound = result;
      io.to(gameRoom).emit('round:result', {
        round: result,
        actualResult: result.actualResult,
        aiCorrect: result.isAiCorrect
      });
    },

    userBalance: (userId, balance) => {
      io.to(`user-${userId}`).emit('wallet:updated', {
        balance,
        timestamp: new Date()
      });
    },

    gameStats: (stats) => {
      io.to(gameRoom).emit('game:stats', stats);
    },

    error: (userId, message) => {
      io.to(`user-${userId}`).emit('error:message', { message });
    }
  };

  /**
   * Timer countdown
   */
  const startGameLoop = () => {
    setInterval(async () => {
      if (gameState.bettingActive) {
        gameState.roundTimer--;

        // Broadcast timer every 5 seconds
        if (gameState.roundTimer % 5 === 0) {
          io.to(gameRoom).emit('game:timer', gameState.roundTimer);
        }
      }
    }, 1000);
  };

  return { broadcast, startGameLoop, gameState };
}

module.exports = { setupGameEvents };
