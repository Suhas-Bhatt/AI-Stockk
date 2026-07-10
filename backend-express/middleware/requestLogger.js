/**
 * middleware/requestLogger.js
 * ============================
 * Morgan HTTP request logger.
 * Logs to console in dev, to file in production.
 */

const morgan = require("morgan");
const fs     = require("fs");
const path   = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// ── Development: colorized console output ─────────────────────────────────────
const devLogger = morgan("dev");

// ── Production: write to access.log ──────────────────────────────────────────
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, "access.log"),
    { flags: "a" }  // Append mode
);
const prodLogger = morgan("combined", { stream: accessLogStream });

// Export the appropriate logger based on environment
module.exports = process.env.NODE_ENV === "production" ? prodLogger : devLogger;
