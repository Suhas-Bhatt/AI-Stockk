/**
 * models/StockRecommendation.js
 * ==============================
 * Stores AI-generated stock analysis results from the pipeline.
 * Now includes userId, datasetId linkage and pipeline audit log.
 */

const mongoose = require("mongoose");

const PipelineLogSchema = new mongoose.Schema(
    {
        step:      { type: String },  // "financial", "sentiment", "recommendation", "error"
        message:   { type: String },
        timestamp: { type: Date, default: Date.now }
    },
    { _id: false }
);

const StockRecommendationSchema = new mongoose.Schema(
    {
        // ── Stock Identity ─────────────────────────────────────────────────────
        symbol: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },

        // ── Ownership ─────────────────────────────────────────────────────────
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        datasetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dataset",
            default: null
        },

        // ── Financial Metrics ─────────────────────────────────────────────────
        close_price:      { type: Number, default: 0 },
        revenue:          { type: Number, default: 0 },   // revenue_growth %
        profit:           { type: Number, default: 0 },   // profit_margin %
        eps:              { type: Number, default: 0 },   // eps_trend ₹

        // ── AI Scores ─────────────────────────────────────────────────────────
        sentiment_score:  { type: Number, default: 0.5, min: 0, max: 1 },
        financial_score:  { type: Number, default: 0,   min: 0, max: 1 },
        final_score:      { type: Number, default: 0,   min: 0, max: 1 },

        // ── Recommendation ────────────────────────────────────────────────────
        recommendation: {
            type: String,
            enum: ["BUY", "HOLD", "SELL", "PENDING"],
            default: "PENDING",
            index: true
        },

        // ── File Reference ────────────────────────────────────────────────────
        csvFileUrl: {
            type: String,
            default: ""     // URL or local path to the CSV that generated this result
        },

        // ── Pipeline Audit ────────────────────────────────────────────────────
        pipelineLogs:    { type: [PipelineLogSchema], default: [] },
        processingTime:  { type: Number, default: 0 },  // milliseconds
        analysedAt:      { type: Date, default: Date.now, index: true }
    },
    {
        timestamps: true
    }
);

// ── Compound Indexes ──────────────────────────────────────────────────────────
StockRecommendationSchema.index({ recommendation: 1, analysedAt: -1 });
StockRecommendationSchema.index({ userId: 1, analysedAt: -1 });

module.exports = mongoose.model("StockRecommendation", StockRecommendationSchema);
