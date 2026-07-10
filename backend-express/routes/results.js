/**
 * routes/results.js
 * ==================
 * AI Prediction Results API:
 *   GET    /api/results          → All stock results (paginated, filterable)
 *   GET    /api/results/stats    → Summary counts by recommendation type
 *   GET    /api/results/:symbol  → Single stock result
 *   DELETE /api/results/:symbol  → Delete a stock result
 */

const express        = require("express");
const StockRec       = require("../models/StockRecommendation");
const authMiddleware = require("../middleware/auth");
const asyncHandler   = require("../utils/asyncHandler");
const router         = express.Router();

// ── GET /api/results/stats  ───────────────────────────────────────────────────
// Must be declared BEFORE /:symbol to avoid "stats" being caught as a symbol param
router.get("/stats", authMiddleware, asyncHandler(async (req, res) => {
    const [counts, recent] = await Promise.all([
        StockRec.aggregate([
            { $group: { _id: "$recommendation", count: { $sum: 1 } } }
        ]),
        StockRec.find({})
            .sort({ analysedAt: -1 })
            .limit(5)
            .select("symbol recommendation final_score analysedAt")
            .lean()
    ]);

    const stats = { BUY: 0, HOLD: 0, SELL: 0, PENDING: 0, TOTAL: 0 };
    counts.forEach(c => {
        if (stats[c._id] !== undefined) stats[c._id] = c.count;
        stats.TOTAL += c.count;
    });

    return res.status(200).json({
        success: true,
        data: { counts: stats, recent }
    });
}));

// ── GET /api/results ──────────────────────────────────────────────────────────
router.get("/", authMiddleware, asyncHandler(async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page   || "1",   10));
    const limit  = Math.min(100, parseInt(req.query.limit || "50",  10));
    const skip   = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (req.query.filter && ["BUY", "HOLD", "SELL", "PENDING"].includes(req.query.filter.toUpperCase())) {
        filter.recommendation = req.query.filter.toUpperCase();
    }
    if (req.query.search) {
        filter.symbol = { $regex: req.query.search.toUpperCase(), $options: "i" };
    }

    const [stocks, total] = await Promise.all([
        StockRec.find(filter)
            .sort({ analysedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        StockRec.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: stocks,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
}));

// ── GET /api/results/:symbol ──────────────────────────────────────────────────
router.get("/:symbol", authMiddleware, asyncHandler(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const stock  = await StockRec.findOne({ symbol }).lean();

    if (!stock) {
        return res.status(404).json({
            success: false,
            message: `No data found for symbol: ${symbol}`
        });
    }

    return res.status(200).json({ success: true, data: stock });
}));

// ── DELETE /api/results/:symbol ───────────────────────────────────────────────
router.delete("/:symbol", authMiddleware, asyncHandler(async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const stock  = await StockRec.findOneAndDelete({ symbol });

    if (!stock) {
        return res.status(404).json({
            success: false,
            message: `No record found for symbol: ${symbol}`
        });
    }

    return res.status(200).json({
        success: true,
        message: `Result for ${symbol} deleted successfully`
    });
}));

module.exports = router;
