/**
 * middleware/auth.js
 * ===================
 * JWT verification middleware.
 * Attaches decoded user payload to req.user.
 * Supports optional guest mode via req.guestAllowed.
 */

const jwt = require("jsonwebtoken");

// ── Standard auth guard (token required) ─────────────────────────────────────
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized — no token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, name, role, isGuest }
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired — please login again"
            });
        }
        return res.status(401).json({
            success: false,
            message: "Unauthorized — invalid token"
        });
    }
};

// ── Admin-only guard ──────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Forbidden — admin access required"
        });
    }
    next();
};

// ── Optional auth (attaches user if token exists, but doesn't block) ─────────
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }
    const token = authHeader.split(" ")[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        req.user = null;
    }
    next();
};

module.exports = authMiddleware;
module.exports.adminOnly = adminOnly;
module.exports.optionalAuth = optionalAuth;
