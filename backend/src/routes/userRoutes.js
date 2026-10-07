const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.get('/profile', auth, userController.getUserProfile);
router.get('/bet-history', auth, userController.getBetHistory);
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;
