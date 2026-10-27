/**
 * services/storage.js
 * ====================
 * Abstracted file storage service.
 * Supports two modes controlled by STORAGE_MODE env var:
 *   - "local"      → saves to ./uploads/ directory (default, zero config)
 *   - "cloudinary" → uploads to Cloudinary (requires credentials in .env)
 *
 * Returns a consistent StorageResult object regardless of backend.
 */

const path      = require("path");
const fs        = require("fs");
const cloudinary = require("cloudinary").v2;

// ── Ensure uploads directory exists ──────────────────────────────────────────
const UPLOAD_DIR = path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, "../uploads")
);
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Configure Cloudinary (only used if STORAGE_MODE=cloudinary) ───────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// Save a file from an in-memory buffer (multer memoryStorage)
// Returns: { storageMode, fileName, filePath, fileUrl, publicId }
// ─────────────────────────────────────────────────────────────────────────────
async function saveFile(buffer, originalName) {
    const mode     = process.env.STORAGE_MODE || "local";
    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    if (mode === "cloudinary") {
        // Verify credentials exist
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            throw new Error("Cloudinary credentials not configured. Set STORAGE_MODE=local or add Cloudinary keys.");
        }

        const result = await uploadToCloudinary(buffer, safeName);
        return {
            storageMode: "cloudinary",
            fileName:    safeName,
            filePath:    "",
            fileUrl:     result.secure_url,
            publicId:    result.public_id
        };
    }

    // ── Default: Local Storage ────────────────────────────────────────────────
    const destPath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(destPath, buffer);

    return {
        storageMode: "local",
        fileName:    safeName,
        filePath:    destPath,
        fileUrl:     `/uploads/${safeName}`,  // Relative URL for static serving
        publicId:    ""
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete a stored file
// ─────────────────────────────────────────────────────────────────────────────
async function deleteFile(storageMode, fileName, publicId) {
    try {
        if (storageMode === "cloudinary" && publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        } else if (storageMode === "local" && fileName) {
            const filePath = path.join(UPLOAD_DIR, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (err) {
        console.error("⚠️  File deletion warning:", err.message);
        // Non-fatal — continue even if file cleanup fails
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: Upload buffer to Cloudinary
// ─────────────────────────────────────────────────────────────────────────────
function uploadToCloudinary(buffer, filename) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                folder:        "ai_stock_csvs",
                public_id:     filename.replace(".csv", ""),
                use_filename:  true,
                overwrite:     true,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

module.exports = { saveFile, deleteFile, UPLOAD_DIR };
