/**
 * routes/datasets.js
 * ===================
 * Dataset management CRUD:
 *   GET    /api/datasets          → List user's datasets (paginated)
 *   GET    /api/datasets/:id      → Single dataset details
 *   PUT    /api/datasets/:id      → Update description, tags
 *   DELETE /api/datasets/:id      → Delete dataset + file
 */

const express       = require("express");
const { body, query, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth");
const asyncHandler   = require("../utils/asyncHandler");
const { deleteFile } = require("../services/storage");
const Dataset        = require("../models/Dataset");
const StockRec       = require("../models/StockRecommendation");
const router         = express.Router();

// ── GET /api/datasets ─────────────────────────────────────────────────────────
router.get("/", authMiddleware, asyncHandler(async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit  = Math.min(50, parseInt(req.query.limit || "10", 10));
    const skip   = (page - 1) * limit;

    const filter = { userId: req.user.isGuest ? null : req.user.id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.symbol) filter.symbol = { $regex: req.query.symbol, $options: "i" };

    const [datasets, total] = await Promise.all([
        Dataset.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Dataset.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: datasets,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
}));

// ── GET /api/datasets/:id ─────────────────────────────────────────────────────
router.get("/:id", authMiddleware, asyncHandler(async (req, res) => {
    const dataset = await Dataset.findById(req.params.id).lean();

    if (!dataset) {
        return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    // Verify ownership (guests can view their session's datasets)
    const ownerId = dataset.userId?.toString();
    const reqId   = req.user.isGuest ? null : req.user.id?.toString();
    if (ownerId && ownerId !== reqId) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, data: dataset });
}));

// ── PUT /api/datasets/:id ─────────────────────────────────────────────────────
router.put(
    "/:id",
    authMiddleware,
    [
        body("description").optional().trim().isLength({ max: 500 })
            .withMessage("Description cannot exceed 500 characters"),
        body("tags").optional().isArray()
            .withMessage("Tags must be an array of strings")
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const dataset = await Dataset.findById(req.params.id);
        if (!dataset) {
            return res.status(404).json({ success: false, message: "Dataset not found" });
        }

        const ownerId = dataset.userId?.toString();
        const reqId   = req.user.isGuest ? null : req.user.id?.toString();
        if (ownerId && ownerId !== reqId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const { description, tags } = req.body;
        if (description !== undefined) dataset.description = description;
        if (tags        !== undefined) dataset.tags        = tags;
        await dataset.save();

        return res.status(200).json({
            success: true,
            message: "Dataset updated successfully",
            data: dataset
        });
    })
);

// ── DELETE /api/datasets/:id ──────────────────────────────────────────────────
router.delete("/:id", authMiddleware, asyncHandler(async (req, res) => {
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset) {
        return res.status(404).json({ success: false, message: "Dataset not found" });
    }

    const ownerId = dataset.userId?.toString();
    const reqId   = req.user.isGuest ? null : req.user.id?.toString();
    if (ownerId && ownerId !== reqId) {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Delete the physical file
    await deleteFile(dataset.storageMode, dataset.fileName, dataset.publicId);

    // Remove Dataset document
    await dataset.deleteOne();

    return res.status(200).json({
        success: true,
        message: `Dataset '${dataset.originalName}' deleted successfully`
    });
}));

module.exports = router;
