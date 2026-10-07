const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { auth, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/current-round', gameController.getCurrentRound);
router.get('/recent-rounds', gameController.getRecentRounds);
router.get('/stats', gameController.getGameStats);
router.get('/round/:roundId', gameController.getRoundDetails);

// Protected routes
router.post('/bet', auth, gameController.placeBet);

// Admin routes
router.post('/admin/start-round', auth, adminOnly, gameController.adminStartRound);
router.post('/admin/finalize-round', auth, adminOnly, gameController.adminFinalizeRound);

module.exports = router;
