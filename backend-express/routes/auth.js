/**
 * routes/auth.js
 * ===============
 * Complete authentication system:
 *   POST   /api/auth/signup   → Register new user
 *   POST   /api/auth/login    → Login, returns JWT
 *   POST   /api/auth/guest    → Guest session JWT
 *   POST   /api/auth/logout   → Logout (stateless, client clears token)
 *   GET    /api/auth/me       → Get current user profile
 *   PUT    /api/auth/profile  → Update name, avatar, phone
 */

const express  = require("express");
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User          = require("../models/User");
const authMiddleware = require("../middleware/auth");
const asyncHandler  = require("../utils/asyncHandler");
const router        = express.Router();

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
const signToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

// ── Helper: send validation errors ───────────────────────────────────────────
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors:  errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    return null;
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/signup
// ══════════════════════════════════════════════════════════════════════════════
router.post(
    "/signup",
    [
        body("name")
            .trim()
            .notEmpty().withMessage("Name is required")
            .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters"),
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Please provide a valid email address")
            .normalizeEmail(),
        body("password")
            .notEmpty().withMessage("Password is required")
            .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
            .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
            .withMessage("Password must contain at least one letter and one number")
    ],
    asyncHandler(async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        await User.create({ name, email, password });

        return res.status(201).json({
            success: true,
            message: "Account created successfully! Please login."
        });
    })
);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════════════════════════════════════════
router.post(
    "/login",
    [
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email format")
            .normalizeEmail(),
        body("password")
            .notEmpty().withMessage("Password is required")
    ],
    asyncHandler(async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        const { email, password } = req.body;

        // Explicitly select password (excluded by default in User schema)
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Update lastLoginAt
        await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

        const token = signToken({
            id:    user._id,
            email: user.email,
            name:  user.name,
            role:  user.role
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: user.toPublicJSON()
        });
    })
);

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/guest
// ══════════════════════════════════════════════════════════════════════════════
router.post("/guest", asyncHandler(async (req, res) => {
    const token = signToken({
        id:      "guest_id",
        email:   "guest@demo.com",
        name:    "Guest User",
        role:    "user",
        isGuest: true
    });

    return res.status(200).json({
        success: true,
        message: "Guest session started",
        token,
        user: {
            _id:     "guest_id",
            name:    "Guest User",
            email:   "guest@demo.com",
            role:    "user",
            isGuest: true
        }
    });
}));

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout
// Stateless logout — client should discard the JWT.
// ══════════════════════════════════════════════════════════════════════════════
router.post("/logout", authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logged out successfully. Please discard your token."
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me
// Returns current user's profile
// ══════════════════════════════════════════════════════════════════════════════
router.get("/me", authMiddleware, asyncHandler(async (req, res) => {
    // Guest users don't have a DB record
    if (req.user.isGuest) {
        return res.status(200).json({
            success: true,
            data: {
                _id:     "guest_id",
                name:    "Guest User",
                email:   "guest@demo.com",
                role:    "user",
                isGuest: true
            }
        });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    return res.status(200).json({
        success: true,
        data: user.toPublicJSON()
    });
}));

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/auth/profile
// Update current user's name, avatar, phone
// ══════════════════════════════════════════════════════════════════════════════
router.put(
    "/profile",
    authMiddleware,
    [
        body("name")
            .optional()
            .trim()
            .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters"),
        body("phone")
            .optional()
            .trim()
            .isLength({ max: 20 }).withMessage("Phone cannot exceed 20 characters"),
        body("avatar")
            .optional()
            .trim()
            .isURL().withMessage("Avatar must be a valid URL")
    ],
    asyncHandler(async (req, res) => {
        if (req.user.isGuest) {
            return res.status(403).json({
                success: false,
                message: "Guest users cannot update profile. Please create an account."
            });
        }

        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        const { name, avatar, phone } = req.body;
        const updateFields = {};
        if (name   !== undefined) updateFields.name   = name;
        if (avatar !== undefined) updateFields.avatar = avatar;
        if (phone  !== undefined) updateFields.phone  = phone;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user.toPublicJSON()
        });
    })
);

module.exports = router;
