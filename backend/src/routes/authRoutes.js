const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { validateRegister, validateLogin } = require('../validators/schemas');
const { ValidationError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = validateRegister(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { username, email, password } = value;

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existing) {
      throw new ConflictError(
        existing.username === username 
          ? 'Username already exists' 
          : 'Email already exists'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        walletBalance: parseFloat(process.env.INITIAL_BALANCE) || 1000,
        isActive: true,
        isAdmin: false
      }
    });

    const token = generateToken(user);

    logger.info(`✅ User registered: ${username}`);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = validateLogin(req.body);
    if (error) throw new ValidationError(error.details[0].message);

    const { email, password } = value;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new ValidationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ValidationError('Account is disabled');
    }

    const token = generateToken(user);

    logger.info(`✅ User logged in: ${user.username}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      walletBalance: user.walletBalance,
      totalBets: user.totalBets,
      totalWinnings: user.totalWinnings,
      winRate: user.winRate,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
