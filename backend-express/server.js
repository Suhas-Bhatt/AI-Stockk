/**
 * server.js — AI Stock Recommendation Express.js Entry Point (v2.0)
 * ==================================================================
 * Production-ready MERN backend.
 * Tech: Express.js + MongoDB Atlas + Mongoose + JWT + Gemini + XGBoost
 *
 * Run:   npm run dev   (development with nodemon)
 *        npm start     (production)
 */

require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const compression  = require("compression");
const path         = require("path");
const connectDB    = require("./config/db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler  = require("./middleware/errorHandler");
const { apiLimiter, authLimiter, uploadLimiter } = require("./middleware/rateLimiter");

const app = express();

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }  // Allow static file serving
}));

// CORS — allow only the frontend URL (configurable via CLIENT_URL)
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174"
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════
app.use(compression());                                 // Gzip responses
app.use(requestLogger);                                 // HTTP request logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ══════════════════════════════════════════════════════════════════════════════
// STATIC FILE SERVING — for locally uploaded CSV files
// ══════════════════════════════════════════════════════════════════════════════
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK (public, no auth)
// ══════════════════════════════════════════════════════════════════════════════
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "AI Stock Recommendation API",
        version: "2.0.0",
        stack:   "Express.js + MongoDB Atlas + XGBoost + Gemini",
        status:  "operational",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    const mongoose = require("mongoose");
    res.json({
        success: true,
        status: "healthy",
        db:     mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        uptime: Math.floor(process.uptime()) + "s"
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════════════════════
app.use("/api/auth",     authLimiter,   require("./routes/auth"));
app.use("/api/upload",   uploadLimiter, require("./routes/upload"));
app.use("/api/pipeline", apiLimiter,    require("./routes/pipeline"));
app.use("/api/results",  apiLimiter,    require("./routes/results"));
app.use("/api/chatbot",  apiLimiter,    require("./routes/chatbot"));
app.use("/api/datasets", apiLimiter,    require("./routes/datasets"));
app.use("/api/watchlist",apiLimiter,    require("./routes/watchlist"));

// ══════════════════════════════════════════════════════════════════════════════
// 404 HANDLER
// ══════════════════════════════════════════════════════════════════════════════
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER (must be last)
// ══════════════════════════════════════════════════════════════════════════════
app.use(errorHandler);

// ══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`💾 Storage Mode: ${process.env.STORAGE_MODE || "local"}`);
        console.log(`\n📋 API Endpoints:`);
        console.log(`   POST  /api/auth/signup`);
        console.log(`   POST  /api/auth/login`);
        console.log(`   GET   /api/auth/me`);
        console.log(`   POST  /api/upload`);
        console.log(`   GET   /api/datasets`);
        console.log(`   POST  /api/pipeline`);
        console.log(`   GET   /api/results`);
        console.log(`   POST  /api/chatbot`);
        console.log(`   GET   /api/watchlist\n`);
    });

    // ── Graceful Shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
        console.log(`\n${signal} received — shutting down gracefully...`);
        server.close(async () => {
            const mongoose = require("mongoose");
            await mongoose.connection.close();
            console.log("✅ MongoDB connection closed");
            console.log("✅ Server closed");
            process.exit(0);
        });
        // Force close after 10s
        setTimeout(() => process.exit(1), 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
        console.error("❌ Unhandled Rejection:", reason);
    });
};

startServer();
