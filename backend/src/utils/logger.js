'use strict';

const { createLogger, format, transports } = require('winston');

const {
  combine,
  timestamp,
  errors,
  json,
  colorize,
  printf,
  splat,
} = format;

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'development' ? 'debug' : 'info');

const devFormat = combine(
  colorize(),
  timestamp(),
  splat(),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const base = `${ts} ${level}: ${message}`;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack ? `${base}\n${stack}${metaStr}` : `${base}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  splat(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: LOG_LEVEL,
  format: NODE_ENV === 'development' ? devFormat : prodFormat,
  defaultMeta: {
    service: 'skycrop-backend',
    environment: NODE_ENV,
  },
  transports: [
    new transports.Console(),
  ],
});

/**
 * Morgan stream bridge to Winston.
 * Usage: morgan('combined', { stream: loggerStream })
 */
const loggerStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = {
  logger,
  loggerStream,
};