/**
 * models/Dataset.js
 * ==================
 * Stores metadata for every CSV file uploaded by a user.
 * The actual file is stored either locally (./uploads) or on Cloudinary.
 *
 * Collection: datasets
 */

const mongoose = require("mongoose");

const DatasetSchema = new mongoose.Schema(
    {
        // ── Ownership ─────────────────────────────────────────────────────────
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // ── File Info ─────────────────────────────────────────────────────────
        originalName: {
            type: String,
            required: true,
            trim: true        // e.g. "AXISBANK.csv"
        },
        fileName: {
            type: String,
            required: true    // e.g. "1720361234567-AXISBANK.csv" (unique on disk)
        },

        // Storage: one of these will be set depending on STORAGE_MODE
        filePath: {
            type: String,
            default: ""       // Local path: "./uploads/filename.csv"
        },
        fileUrl: {
            type: String,
            default: ""       // Cloudinary URL (if STORAGE_MODE=cloudinary)
        },
        publicId: {
            type: String,
            default: ""       // Cloudinary public_id (for deletion)
        },
        storageMode: {
            type: String,
            enum: ["local", "cloudinary"],
            default: "local"
        },

        // ── Metadata ──────────────────────────────────────────────────────────
        fileSize: {
            type: Number,
            default: 0        // bytes
        },
        mimeType: {
            type: String,
            default: "text/csv"
        },
        symbol: {
            type: String,
            uppercase: true,
            default: ""       // Stock ticker derived from filename, e.g. "AXISBANK"
        },
        rowCount: {
            type: Number,
            default: 0        // Number of data rows (excluding header)
        },
        description: {
            type: String,
            default: "",
            maxlength: [500, "Description cannot exceed 500 characters"]
        },
        tags: {
            type: [String],
            default: []
        },

        // ── Processing Status ─────────────────────────────────────────────────
        status: {
            type: String,
            enum: ["uploaded", "processing", "processed", "failed"],
            default: "uploaded",
            index: true
        }
    },
    {
        timestamps: true    // createdAt = uploadedAt, updatedAt
    }
);

// ── Compound Indexes ──────────────────────────────────────────────────────────
DatasetSchema.index({ userId: 1, createdAt: -1 });
DatasetSchema.index({ symbol: 1 });

module.exports = mongoose.model("Dataset", DatasetSchema);
