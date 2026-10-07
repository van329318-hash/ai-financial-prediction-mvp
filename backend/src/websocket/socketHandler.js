const GameService = require('../services/gameService');
const GameModel = require('../models/gameModel');
const BetModel = require('../models/betModel');

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`📡 User connected: ${socket.id}`);

    /**
     * Join game room
     */
    socket.on('join-game', async (data) => {
      socket.join('game-room');
      console.log(`🎮 ${data.username} joined game`);

      // Send current round info
      try {
        const round = await GameModel.getCurrentRound();
        socket.emit('round-info', round);
      } catch (error) {
        socket.emit('error', error.message);
      }
    });

    /**
     * Place bet via WebSocket
     */
    socket.on('place-bet', async (data) => {
      try {
        const { userId, roundId, betType, amount } = data;

        const bet = await GameService.placeBet(userId, roundId, betType, amount);

        // Broadcast bet stats update
        const summary = await BetModel.getRoundBettingSummary(roundId);
        io.to('game-room').emit('betting-update', summary);

        socket.emit('bet-placed', { success: true, bet });
      } catch (error) {
        socket.emit('bet-error', { error: error.message });
      }
    });

    /**
     * Listen for round updates
     */
    socket.on('subscribe-round', async (roundId) => {
      socket.join(`round-${roundId}`);
      const roundDetails = await GameService.getRoundDetails(roundId);
      socket.emit('round-details', roundDetails);
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  /**
   * Broadcast game events
   */
  return {
    broadcastRoundStart: (round) => {
      io.to('game-room').emit('round-started', round);
    },

    broadcastBettingClosed: (roundId) => {
      io.to('game-room').emit('betting-closed', { roundId });
    },

    broadcastRoundResult: (result) => {
      io.to('game-room').emit('round-result', result);
    },

    broadcastUserUpdate: (userId, data) => {
      io.to(`user-${userId}`).emit('user-update', data);
    }
  };
}

module.exports = { setupWebSocket };
