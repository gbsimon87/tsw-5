const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { ipKeyGenerator } = require('express-rate-limit');

// Winston Logger Setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console()
  ]
});

// Rate Limit Middleware (in-memory store)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per IP
  message: { error: 'Too many registration attempts, please try again later', code: 'too_many_attempts' },
  keyGenerator: (req) => ipKeyGenerator(req, { normalize: true })
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per IP
  message: { error: 'Too many login attempts, please try again later', code: 'too_many_attempts' },
  keyGenerator: (req) => ipKeyGenerator(req, { normalize: true })
});

const googleAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per IP
  message: { error: 'Too many Google auth attempts, please try again later', code: 'too_many_attempts' },
  keyGenerator: (req) => ipKeyGenerator(req, { normalize: true })
});

const meLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per user ID/IP
  message: { error: 'Too many requests, please try again later', code: 'too_many_attempts' },
  keyGenerator: (req) => `${ipKeyGenerator(req, { normalize: true })}:${req.user?.userId || 'anonymous'}`
});

module.exports = {
  registerLimiter,
  loginLimiter,
  googleAuthLimiter,
  meLimiter,
  logger
};