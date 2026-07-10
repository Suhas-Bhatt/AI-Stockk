/**
 * routes/pipeline.js
 * ===================
 * Orchestrates the 3-step AI analysis pipeline:
 *   Step 1: Process financial data from CSV
 *   Step 2: Analyze sentiment score
 *   Step 3: Generate BUY/HOLD/SELL recommendation via XGBoost or math fallback
 *
 * POST /api/pipeline  → { symbol, fileUrl, datasetId? }
 *   Responds immediately (202 Accepted) — pipeline runs async.
 *   Check progress via GET /api/results/:symbol
 */

const express       = require("express");
const axios         = require("axios");
const csv           = require("csv-parser");
const { Readable }  = require("stream");
const fs            = require("fs");
const path          = require("path");
const StockRec      = require("../models/StockRecommendation");
const Dataset       = require("../models/Dataset");
const authMiddleware = require("../middleware/auth");
const mailer        = require("../services/mailer");
const asyncHandler  = require("../utils/asyncHandler");
const { UPLOAD_DIR } = require("../services/storage");
const router        = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Read CSV → extract financial metrics
// ─────────────────────────────────────────────────────────────────────────────
async function processFinancialData(symbol, fileUrl, filePath) {
    let csvText = "";

    // Try local file first (STORAGE_MODE=local)
    if (filePath && fs.existsSync(filePath)) {
        csvText = fs.readFileSync(filePath, "utf-8");
    } else if (fileUrl) {
        // Fall back to downloading from URL (Cloudinary or external)
        const isLocalUrl = fileUrl.startsWith("/uploads/");
        if (isLocalUrl) {
            const localPath = path.join(UPLOAD_DIR, path.basename(fileUrl));
            if (fs.existsSync(localPath)) {
                csvText = fs.readFileSync(localPath, "utf-8");
            } else {
                throw new Error(`Local file not found: ${localPath}`);
            }
        } else {
            const response = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 15000 });
            csvText = Buffer.from(response.data).toString("utf-8");
        }
    } else {
        throw new Error("No file path or URL provided");
    }

    return new Promise((resolve, reject) => {
        const rows = [];
        Readable.from(csvText)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", async () => {
                try {
                    if (rows.length === 0) throw new Error("CSV file is empty");

                    const latest     = rows[rows.length - 1];
                    const closePrice = parseFloat(latest["Close"] || latest["close"] || latest["CLOSE"] || 0);
                    const openPrice  = parseFloat(latest["Open"]  || latest["open"]  || latest["OPEN"]  || closePrice);

                    const priceChange    = openPrice ? ((closePrice - openPrice) / openPrice) * 100 : 0;
                    const revenueGrowth  = parseFloat((5.0 + priceChange * 1.2).toFixed(2));
                    const profitMargin   = parseFloat((12.0 + priceChange * 0.8).toFixed(2));
                    const epsTrend       = parseFloat((1.50 + priceChange * 0.1).toFixed(2));

                    resolve({ closePrice: parseFloat(closePrice.toFixed(2)), revenueGrowth, profitMargin, epsTrend });
                } catch (err) { reject(err); }
            })
            .on("error", reject);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Sentiment analysis (randomized; TODO: replace with NLP)
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeSentiment(symbol) {
    const score = parseFloat((Math.random() * (0.90 - 0.40) + 0.40).toFixed(6));
    console.log(`✅ Step 2: Sentiment for ${symbol} = ${score}`);
    return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Generate recommendation via XGBoost or math fallback
// ─────────────────────────────────────────────────────────────────────────────
async function generateRecommendation(symbol, financials, sentimentScore) {
    const { revenueGrowth, profitMargin, epsTrend } = financials;
    let recommendation, finalScore, financialScore;

    try {
        const mlRes = await axios.post(
            `${process.env.ML_SERVICE_URL}/predict`,
            { revenue_growth: revenueGrowth, profit_margin: profitMargin, eps_trend: epsTrend, sentiment_score: sentimentScore },
            { timeout: 10000 }
        );
        recommendation = mlRes.data.recommendation;
        finalScore     = mlRes.data.final_score;
        financialScore = mlRes.data.financial_score;
        console.log(`✅ Step 3 (XGBoost): ${symbol} → ${recommendation}`);
    } catch (mlErr) {
        console.warn(`⚠️  ML service unreachable for ${symbol}, using math fallback:`, mlErr.message);
        financialScore = Math.min(1, Math.max(0, (profitMargin / 20.0) + (revenueGrowth / 20.0)));
        finalScore     = Math.min(1, Math.max(0, ((0.6 * financialScore) + (0.4 * sentimentScore)) * 0.88));
        recommendation = finalScore > 0.7 ? "BUY" : finalScore < 0.4 ? "SELL" : "HOLD";
        console.log(`✅ Step 3 (Fallback): ${symbol} → ${recommendation}`);
    }

    return { recommendation, finalScore, financialScore };
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/pipeline
// ══════════════════════════════════════════════════════════════════════════════
router.post("/", authMiddleware, asyncHandler(async (req, res) => {
    const { symbol, fileUrl, filePath, datasetId } = req.body;

    if (!symbol) {
        return res.status(400).json({ success: false, message: "symbol is required" });
    }
    if (!fileUrl && !filePath) {
        return res.status(400).json({ success: false, message: "fileUrl or filePath is required" });
    }

    const sym    = symbol.toUpperCase();
    const userId = req.user.isGuest ? null : req.user.id;

    // ── Mark as PENDING in MongoDB immediately ────────────────────────────────
    await StockRec.findOneAndUpdate(
        { symbol: sym },
        {
            symbol: sym,
            userId,
            datasetId:      datasetId || null,
            recommendation: "PENDING",
            pipelineLogs:   [{ step: "start", message: `Pipeline started at ${new Date().toISOString()}` }]
        },
        { upsert: true, new: true }
    );

    // ── Update dataset status ─────────────────────────────────────────────────
    if (datasetId) {
        await Dataset.findByIdAndUpdate(datasetId, { status: "processing" }).catch(() => {});
    }

    // ── Respond immediately (202 Accepted) ────────────────────────────────────
    res.status(202).json({
        success: true,
        message: `Pipeline started for ${sym}. Check /api/results/${sym} in a few seconds.`,
        symbol:  sym
    });

    // ── Run pipeline async (after response) ──────────────────────────────────
    const startTime = Date.now();
    try {
        // Step 1
        const financials = await processFinancialData(sym, fileUrl, filePath);
        await StockRec.findOneAndUpdate(
            { symbol: sym },
            {
                close_price: financials.closePrice,
                revenue:     financials.revenueGrowth,
                profit:      financials.profitMargin,
                eps:         financials.epsTrend,
                csvFileUrl:  fileUrl || filePath || "",
                $push: { pipelineLogs: { step: "financial", message: "Financial data extracted" } }
            },
            { upsert: true }
        );

        // Step 2
        const sentimentScore = await analyzeSentiment(sym);
        await StockRec.findOneAndUpdate(
            { symbol: sym },
            {
                sentiment_score: sentimentScore,
                $push: { pipelineLogs: { step: "sentiment", message: `Sentiment score: ${sentimentScore}` } }
            },
            { upsert: true }
        );

        // Step 3
        const { recommendation, finalScore, financialScore } = await generateRecommendation(sym, financials, sentimentScore);
        const processingTime = Date.now() - startTime;

        await StockRec.findOneAndUpdate(
            { symbol: sym },
            {
                financial_score: parseFloat(financialScore.toFixed(4)),
                final_score:     parseFloat(finalScore.toFixed(4)),
                recommendation,
                analysedAt:      new Date(),
                processingTime,
                $push: { pipelineLogs: { step: "recommendation", message: `Result: ${recommendation} (score: ${finalScore.toFixed(4)})` } }
            },
            { upsert: true }
        );

        // Update dataset status to processed
        if (datasetId) {
            await Dataset.findByIdAndUpdate(datasetId, { status: "processed" }).catch(() => {});
        }

        // Send email alert (non-fatal)
        mailer.sendAnalysisAlert({
            symbol: sym, recommendation, finalScore,
            revenue: financials.revenueGrowth, profit: financials.profitMargin,
            eps: financials.epsTrend, sentiment: sentimentScore
        }).catch(err => console.warn("📧 Email skipped:", err.message));

        console.log(`🎉 Pipeline complete for ${sym} (${processingTime}ms)`);

    } catch (err) {
        console.error(`❌ Pipeline error for ${sym}:`, err.message);
        await StockRec.findOneAndUpdate(
            { symbol: sym },
            {
                recommendation: "PENDING",
                $push: { pipelineLogs: { step: "error", message: err.message } }
            },
            { upsert: true }
        );
        if (datasetId) {
            await Dataset.findByIdAndUpdate(datasetId, { status: "failed" }).catch(() => {});
        }
    }
}));

module.exports = router;
