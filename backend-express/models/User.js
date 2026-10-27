/**
 * models/User.js
 * ===============
 * Production-grade User model with role support and full profile fields.
 * Password is bcrypt-hashed via pre-save hook.
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [60, "Name cannot exceed 60 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                "Please provide a valid email address"
            ]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false   // Never returned in queries by default
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        avatar: {
            type: String,
            default: ""    // URL to profile image
        },
        phone: {
            type: String,
            default: ""
        },
        isGuest: {
            type: Boolean,
            default: false
        },
        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true  // createdAt, updatedAt
    }
);

// ── Additional Indexes ────────────────────────────────────────────────────────
// (email unique index is already declared via `unique: true` on the field above)

// ── Hash password before saving ───────────────────────────────────────────────
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ── Instance method: compare passwords ───────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: return safe public profile (no password) ─────────────────
UserSchema.methods.toPublicJSON = function () {
    return {
        _id:         this._id,
        name:        this.name,
        email:       this.email,
        role:        this.role,
        avatar:      this.avatar,
        phone:       this.phone,
        isGuest:     this.isGuest,
        lastLoginAt: this.lastLoginAt,
        createdAt:   this.createdAt,
        updatedAt:   this.updatedAt
    };
};

module.exports = mongoose.model("User", UserSchema);
