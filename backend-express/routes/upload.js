/**
 * routes/upload.js
 * =================
 * Upload a CSV file and save metadata to MongoDB.
 *
 * POST /api/upload
 *   - Accepts: multipart/form-data with field "file" (.csv only, max 10MB)
 *   - Stores file using storage service (local disk by default)
 *   - Creates a Dataset document in MongoDB
 *   - Returns: { success, datasetId, fileUrl, symbol, storageMode, ... }
 */

const express       = require("express");
const multer        = require("multer");
const { Readable }  = require("stream");
const csv           = require("csv-parser");
const authMiddleware = require("../middleware/auth");
const asyncHandler   = require("../utils/asyncHandler");
const { saveFile }   = require("../services/storage");
const Dataset        = require("../models/Dataset");
const router         = express.Router();

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);

// ── Multer: memory storage (buffer passed to storage service) ─────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: MAX_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isCSV =
            file.mimetype === "text/csv" ||
            file.mimetype === "application/vnd.ms-excel" ||
            file.originalname.toLowerCase().endsWith(".csv");

        if (isCSV) {
            cb(null, true);
        } else {
            cb(Object.assign(new Error("Only .csv files are allowed"), { code: "INVALID_FILE_TYPE" }), false);
        }
    }
});

// ── Helper: count rows in CSV buffer ─────────────────────────────────────────
function countCSVRows(buffer) {
    return new Promise((resolve) => {
        let count = 0;
        const stream = Readable.from(buffer.toString("utf-8"));
        stream
            .pipe(csv())
            .on("data", () => count++)
            .on("end",  () => resolve(count))
            .on("error", () => resolve(0));
    });
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
router.post("/", authMiddleware, upload.single("file"), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No CSV file provided. Use field name: 'file'"
        });
    }

    const originalName = req.file.originalname;
    const symbol       = originalName.split(".")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");

    // ── Save file to storage backend ──────────────────────────────────────────
    const stored = await saveFile(req.file.buffer, originalName);

    // ── Count rows for metadata ───────────────────────────────────────────────
    const rowCount = await countCSVRows(req.file.buffer);

    // ── Create Dataset document in MongoDB ────────────────────────────────────
    const userId = req.user.isGuest ? null : req.user.id;

    const dataset = await Dataset.create({
        userId,
        originalName,
        fileName:    stored.fileName,
        filePath:    stored.filePath,
        fileUrl:     stored.fileUrl,
        publicId:    stored.publicId,
        storageMode: stored.storageMode,
        fileSize:    req.file.size,
        mimeType:    req.file.mimetype || "text/csv",
        symbol,
        rowCount,
        status:      "uploaded"
    });

    return res.status(201).json({
        success:     true,
        message:     "File uploaded successfully",
        datasetId:   dataset._id,
        fileUrl:     stored.fileUrl,
        filePath:    stored.filePath,
        storageMode: stored.storageMode,
        symbol,
        originalName,
        rowCount,
        fileSize:    req.file.size,
        // Backward-compatible fields for pipeline route
        key:         stored.fileName,
        bucket:      stored.storageMode
    });
}));

module.exports = router;
