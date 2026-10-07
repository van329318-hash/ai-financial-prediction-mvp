const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

const initRedis = async () => {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
  });

  redisClient.on('connect', () => logger.info('✅ Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis Error:', err));

  await redisClient.connect();
  return redisClient;
};

const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
};

module.exports = { initRedis, getRedis };
