/**
 * routes/chatbot.js
 * ==================
 * AI-powered stock chatbot using Google Gemini 1.5 Flash.
 * 3-tier data hierarchy:
 *   Tier 1: MongoDB StockRecommendations (internal DB)
 *   Tier 2: Alpha Vantage real-time API
 *   Tier 3: Gemini LLM knowledge base
 *
 * POST /api/chatbot           → Chat with AI
 * GET  /api/chatbot/history   → Get chat history for current user
 */

const express     = require("express");
const axios       = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const StockRec    = require("../models/StockRecommendation");
const ChatHistory = require("../models/ChatHistory");
const authMiddleware = require("../middleware/auth");
const asyncHandler   = require("../utils/asyncHandler");
const router         = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Extract company/stock keyword from query
// ─────────────────────────────────────────────────────────────────────────────
function extractCompanyName(query) {
    const stopWords = new Set([
        "GIVE","ME","THE","STOCKS","STOCK","OF","THROUGH","API","THAT","I","HAVE",
        "GIVEN","TO","YOU","WHAT","IS","PRICE","FOR","HOW","MUCH","A","AN","IN",
        "ON","SHOW","TELL","ABOUT","COMPANY","PLEASE","HI","HELLO","AND","OR",
        "ANY","CURRENT","LATEST","DOING","TODAY","RIGHT","NOW","IT","ANALYZE",
        "HISTORICAL","CSV","DATA","FROM","FETCH","GET","TELL","ANALYSIS","SHOULD","BUY","SELL","HOLD"
    ]);

    const words = query
        .toUpperCase()
        .replace(/[?.,!"']/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    return words[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1: MongoDB internal data
// ─────────────────────────────────────────────────────────────────────────────
async function getMongoData(companyKeyword) {
    try {
        const stock = await StockRec.findOne({
            symbol: { $regex: companyKeyword, $options: "i" }
        }).lean();

        if (!stock) return null;

        return (
            `📊 Internal database data for ${stock.symbol}:\n` +
            `• Recommendation: ${stock.recommendation}\n` +
            `• Final Score: ${(stock.final_score * 100).toFixed(1)}%\n` +
            `• Revenue Growth: ${stock.revenue}%\n` +
            `• Profit Margin: ${stock.profit}%\n` +
            `• EPS Trend: ₹${stock.eps}\n` +
            `• Sentiment Index: ${stock.sentiment_score}\n` +
            `• Last Close Price: ₹${stock.close_price}\n` +
            `• Analysed At: ${new Date(stock.analysedAt).toLocaleString()}`
        );
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2: Alpha Vantage real-time API
// ─────────────────────────────────────────────────────────────────────────────
async function getAlphaVantageData(companyKeyword) {
    const API_KEY = process.env.ALPHA_VANTAGE_KEY;
    if (!API_KEY) return null;

    try {
        const searchRes = await axios.get("https://www.alphavantage.co/query", {
            params: { function: "SYMBOL_SEARCH", keywords: companyKeyword, apikey: API_KEY },
            timeout: 6000
        });

        if (searchRes.data.Information) {
            return "[ALPHA VANTAGE API RATE LIMIT REACHED — using LLM fallback]";
        }

        const matches = searchRes.data.bestMatches || [];
        if (!matches.length) return null;

        let symbol = matches[0]["1. symbol"];
        for (const match of matches) {
            const region = (match["4. region"] || "").toUpperCase();
            if (region.includes("INDIA") || region.includes("BSE") || region.includes("NSE")) {
                symbol = match["1. symbol"];
                break;
            }
        }

        const quoteRes = await axios.get("https://www.alphavantage.co/query", {
            params: { function: "GLOBAL_QUOTE", symbol, apikey: API_KEY },
            timeout: 6000
        });

        if (quoteRes.data.Information) return null;

        const quote = quoteRes.data["Global Quote"] || {};
        if (!quote["05. price"]) return null;

        return (
            `📈 Real-time data for ${symbol} (${companyKeyword}):\n` +
            `• Price: ${quote["05. price"]}\n` +
            `• Change: ${quote["09. change"]} (${quote["10. change percent"]})\n` +
            `• Volume: ${quote["06. volume"]}\n` +
            `• Previous Close: ${quote["08. previous close"]}`
        );
    } catch (err) {
        console.error("Alpha Vantage error:", err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build context-aware Gemini prompt
// ─────────────────────────────────────────────────────────────────────────────
function buildPrompt(userPrompt, mongoData, apiData) {
    if (mongoData) {
        return (
            `The user asked: '${userPrompt}'.\n\n` +
            `Here is data found in the internal MongoDB database:\n${mongoData}\n\n` +
            `Start your response with: 'I found the data in our internal database, here is the answer based on that data: ' ` +
            `then provide 5–6 bullet points.`
        );
    }

    const isValidApi = apiData && !apiData.includes("[") && !apiData.includes("RATE LIMIT");
    if (isValidApi) {
        return (
            `The user asked: '${userPrompt}'.\n\n` +
            `Here is real-time data from Alpha Vantage API:\n${apiData}\n\n` +
            `Start your response with: 'The data was not found in our database, so I retrieved it from Alpha Vantage API. Here is the answer: ' ` +
            `then provide 5–6 bullet points.`
        );
    }

    return (
        `The user asked: '${userPrompt}'.\n\n` +
        `Start your response with: 'I couldn't find this data in our database or APIs, so I am answering from built-in knowledge: ' ` +
        `then answer in 5–6 bullet points.`
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/chatbot/history
// Must be before POST "/" to avoid route collision
// ══════════════════════════════════════════════════════════════════════════════
router.get("/history", authMiddleware, asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    const filter = req.user.isGuest
        ? { userEmail: "guest" }
        : { userId: req.user.id };

    const [history, total] = await Promise.all([
        ChatHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-__v")
            .lean(),
        ChatHistory.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        data: history,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
}));

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/chatbot
// ══════════════════════════════════════════════════════════════════════════════
router.post("/", authMiddleware, asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ success: false, message: "prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            success: false,
            message: "Chatbot is not configured — GEMINI_API_KEY is missing in .env"
        });
    }

    const companyKeyword = extractCompanyName(prompt);
    let mongoData  = null;
    let apiData    = null;
    let dataSource = "LLM";

    if (companyKeyword) {
        mongoData = await getMongoData(companyKeyword);
        if (mongoData) {
            dataSource = "MongoDB";
        } else {
            apiData = await getAlphaVantageData(companyKeyword);
            if (apiData && !apiData.includes("[")) dataSource = "AlphaVantage";
        }
    }

    const enhancedPrompt = buildPrompt(prompt, mongoData, apiData);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction:
            "You are the Alpha Stock Engine AI — an intelligent stock market analyst. " +
            "Always respond in an engaging, professional tone. " +
            "If you receive real-time or database data, clarify the data source. " +
            "Structure every response in exactly 5–6 bullet points."
    });

    const result    = await model.generateContent(enhancedPrompt);
    const aiMessage = result.response.text();

    // Save to ChatHistory
    await ChatHistory.create({
        userId:      req.user.isGuest ? null : req.user.id,
        userEmail:   req.user.email || "guest",
        userPrompt:  prompt,
        botResponse: aiMessage,
        dataSource
    });

    return res.status(200).json({
        success: true,
        response: aiMessage,
        dataSource
    });
}));

module.exports = router;
