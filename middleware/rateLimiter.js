const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
});

// General API rate limiter
const apiLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:api:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

// Stricter rate limiter for wallet operations
const walletLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:wallet:'
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Limit each IP to 30 wallet operations per hour
    message: {
        success: false,
        message: 'Too many wallet operations, please try again later.'
    }
});

// Very strict rate limiter for withdrawals
const withdrawalLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:withdrawal:'
    }),
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // Limit each IP to 10 withdrawals per day
    message: {
        success: false,
        message: 'Daily withdrawal limit reached, please try again tomorrow.'
    }
});

// Track failed login attempts
const loginLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:login:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 failed attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    message: {
        success: false,
        message: 'Too many failed login attempts, please try again later.'
    }
});

module.exports = {
    apiLimiter,
    walletLimiter,
    withdrawalLimiter,
    loginLimiter,
    redis // Export redis client for use in other parts of the application
};
