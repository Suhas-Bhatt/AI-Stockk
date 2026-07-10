/**
 * models/Watchlist.js
 * ====================
 * Stores a user's watchlisted stock symbols in MongoDB.
 * One document per user (upsert pattern).
 */

const mongoose = require("mongoose");

const WatchlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,   // One watchlist per user
            index: true
        },
        symbols: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    return arr.length <= 50;  // Max 50 stocks in watchlist
                },
                message: "Watchlist cannot contain more than 50 stocks"
            }
        }
    },
    {
        timestamps: true
    }
);

// Ensure symbols are always uppercase and unique within the array
WatchlistSchema.pre("save", function (next) {
    this.symbols = [...new Set(this.symbols.map(s => s.toUpperCase()))];
    next();
});

module.exports = mongoose.model("Watchlist", WatchlistSchema);
