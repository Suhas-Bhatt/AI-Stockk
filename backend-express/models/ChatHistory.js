/**
 * models/ChatHistory.js
 * ======================
 * Stores every chatbot conversation turn, linked to a User by ObjectId.
 */

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ChatHistorySchema = new mongoose.Schema(
    {
        interactionId: {
            type: String,
            default: () => uuidv4(),
            unique: true
        },
        // Link to registered user (null for guest sessions)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        // Keep userEmail as a convenience field (used when userId is null / guest)
        userEmail: {
            type: String,
            default: "guest"
        },
        userPrompt: {
            type: String,
            required: true
        },
        botResponse: {
            type: String,
            required: true
        },
        dataSource: {
            type: String,
            enum: ["MongoDB", "AlphaVantage", "LLM"],
            default: "LLM"
        }
    },
    {
        timestamps: true   // createdAt, updatedAt
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
ChatHistorySchema.index({ userId: 1, createdAt: -1 });
ChatHistorySchema.index({ userEmail: 1 });

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
