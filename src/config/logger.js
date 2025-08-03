// src/config/logger.js - Winston Logger Configuration
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Log directory
const logDir = path.join(__dirname, '../../logs');

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'rentaly-backend' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),

    // API logs (HTTP requests/responses)
    new DailyRotateFile({
      filename: path.join(logDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Database logs
    new DailyRotateFile({
      filename: path.join(logDir, 'database-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Auth logs
    new DailyRotateFile({
      filename: path.join(logDir, 'auth-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // General application logs
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // UI interaction logs (for admin panel interactions)
    new DailyRotateFile({
      filename: path.join(logDir, 'ui-interactions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          // Only log UI_INTERACTION type logs to this file
          return info.type === 'UI_INTERACTION' ? info : false;
        })()
      )
    })
  ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Helper functions for specific log types
const logAPI = (method, url, statusCode, duration, error = null, extra = {}) => {
  const logData = {
    type: 'API',
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...extra
  };

  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
    logger.error('API Error', logData);
  } else {
    logger.info('API Request', logData);
  }
};

const logAuth = (action, userId, success, details = {}) => {
  const logData = {
    type: 'AUTH',
    action,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...details
  };

  if (success) {
    logger.info('Auth Success', logData);
  } else {
    logger.warn('Auth Failure', logData);
  }
};

const logDatabase = (operation, table, duration, error = null, extra = {}) => {
  const logData = {
    type: 'DATABASE',
    operation,
    table,
    duration: duration ? `${duration}ms` : null,
    timestamp: new Date().toISOString(),
    ...extra
  };

  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
    logger.error('Database Error', logData);
  } else {
    logger.info('Database Operation', logData);
  }
};

const logError = (error, context = {}) => {
  logger.error('Application Error', {
    type: 'ERROR',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  });
};

const logInfo = (message, data = {}) => {
  logger.info(message, {
    type: 'INFO',
    timestamp: new Date().toISOString(),
    ...data
  });
};

const logUIInteraction = (action, userId, section, details = {}) => {
  const logData = {
    type: 'UI_INTERACTION',
    action,
    userId,
    section,
    timestamp: new Date().toISOString(),
    ...details
  };

  logger.info('UI Interaction', logData);
};

module.exports = {
  logger,
  logAPI,
  logAuth,
  logDatabase,
  logError,
  logInfo,
  logUIInteraction
};