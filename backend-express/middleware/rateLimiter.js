/**
 * middleware/rateLimiter.js
 * ==========================
 * Rate limiting to protect against brute force and abuse.
 */

const rateLimit = require("express-rate-limit");

// ── Auth routes: stricter limit ───────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs:          15 * 60 * 1000, // 15 minutes
    max:               20,              // 20 requests per window per IP
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again in 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders:   false
});

// ── Upload route: limit large file uploads ────────────────────────────────────
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max:      30,              // 30 uploads per hour per IP
    message: {
        success: false,
        message: "Upload limit reached. Please wait before uploading more files."
    },
    standardHeaders: true,
    legacyHeaders:   false
});

// ── General API limiter ───────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs:          15 * 60 * 1000,  // 15 minutes
    max:               200,              // 200 requests per window per IP
    message: {
        success: false,
        message: "Too many requests. Please slow down."
    },
    standardHeaders: true,
    legacyHeaders:   false
});

module.exports = { authLimiter, uploadLimiter, apiLimiter };
