/**
 * routes/watchlist.js
 * ====================
 * Per-user watchlist backed by MongoDB (replaces localStorage).
 *
 *   GET    /api/watchlist          → Get current user's watchlist
 *   POST   /api/watchlist/:symbol  → Add stock to watchlist
 *   DELETE /api/watchlist/:symbol  → Remove stock from watchlist
 *   DELETE /api/watchlist          → Clear entire watchlist
 */

const express        = require("express");
const Watchlist      = require("../models/Watchlist");
const authMiddleware = require("../middleware/auth");
const asyncHandler   = require("../utils/asyncHandler");
const router         = express.Router();

// ── GET /api/watchlist ────────────────────────────────────────────────────────
router.get("/", authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.isGuest) {
        return res.status(200).json({ success: true, data: { symbols: [] } });
    }

    const watchlist = await Watchlist.findOne({ userId: req.user.id }).lean();

    return res.status(200).json({
        success: true,
        data: { symbols: watchlist?.symbols || [] }
    });
}));

// ── POST /api/watchlist/:symbol ───────────────────────────────────────────────
router.post("/:symbol", authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.isGuest) {
        return res.status(403).json({
            success: false,
            message: "Guest users cannot save watchlists. Please create an account."
        });
    }

    const symbol = req.params.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!symbol) {
        return res.status(400).json({ success: false, message: "Invalid stock symbol" });
    }

    const watchlist = await Watchlist.findOneAndUpdate(
        { userId: req.user.id },
        { $addToSet: { symbols: symbol } },  // addToSet prevents duplicates
        { upsert: true, new: true }
    );

    return res.status(200).json({
        success: true,
        message: `${symbol} added to watchlist`,
        data: { symbols: watchlist.symbols }
    });
}));

// ── DELETE /api/watchlist/:symbol ─────────────────────────────────────────────
router.delete("/:symbol", authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.isGuest) {
        return res.status(200).json({ success: true, data: { symbols: [] } });
    }

    const symbol = req.params.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const watchlist = await Watchlist.findOneAndUpdate(
        { userId: req.user.id },
        { $pull: { symbols: symbol } },
        { new: true }
    );

    return res.status(200).json({
        success: true,
        message: `${symbol} removed from watchlist`,
        data: { symbols: watchlist?.symbols || [] }
    });
}));

// ── DELETE /api/watchlist (clear all) ────────────────────────────────────────
router.delete("/", authMiddleware, asyncHandler(async (req, res) => {
    if (req.user.isGuest) {
        return res.status(200).json({ success: true, data: { symbols: [] } });
    }

    await Watchlist.findOneAndUpdate(
        { userId: req.user.id },
        { $set: { symbols: [] } },
        { upsert: true }
    );

    return res.status(200).json({
        success: true,
        message: "Watchlist cleared",
        data: { symbols: [] }
    });
}));

module.exports = router;
