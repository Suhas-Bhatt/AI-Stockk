/**
 * middleware/errorHandler.js
 * ===========================
 * Global Express error handler. Must be registered LAST in server.js.
 * Provides consistent JSON error responses for all error types.
 */

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message    = err.message    || "Internal Server Error";
    let errors     = null;

    // ── Mongoose Validation Error ─────────────────────────────────────────────
    if (err.name === "ValidationError") {
        statusCode = 400;
        errors = Object.values(err.errors).map(e => ({
            field:   e.path,
            message: e.message
        }));
        message = "Validation failed";
    }

    // ── Mongoose Cast Error (invalid ObjectId) ────────────────────────────────
    else if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // ── Mongoose Duplicate Key Error ──────────────────────────────────────────
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    // ── JWT Errors ────────────────────────────────────────────────────────────
    else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }
    else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired — please login again";
    }

    // ── Multer File Size Error ────────────────────────────────────────────────
    else if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 413;
        message = `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB`;
    }
    else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        statusCode = 400;
        message = "Unexpected file field name. Use field name: 'file'";
    }

    // ── Log server errors ─────────────────────────────────────────────────────
    if (statusCode >= 500) {
        console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.url} →`, err);
    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        // Only expose stack trace in development
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = errorHandler;
