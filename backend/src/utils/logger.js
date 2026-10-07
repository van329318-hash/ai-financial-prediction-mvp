const logger = require('winston').createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: require('winston').format.combine(
    require('winston').format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    require('winston').format.errors({ stack: true }),
    require('winston').format.colorize(),
    require('winston').format.printf(({ timestamp, level, message, ...meta }) => {
      let metaStr = '';
      if (Object.keys(meta).length > 0 && meta.stack === undefined) {
        metaStr = ' ' + JSON.stringify(meta);
      }
      return `${timestamp} [${level}] ${message}${metaStr}`;
    })
  ),
  transports: [
    new (require('winston').transports.Console)(),
    new (require('winston').transports.File)({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new (require('winston').transports.File)({
      filename: 'logs/combined.log'
    })
  ]
});

module.exports = logger;
