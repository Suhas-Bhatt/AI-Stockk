/**
 * utils/asyncHandler.js
 * ======================
 * Wraps async route handlers to eliminate try/catch boilerplate.
 * Any thrown error is forwarded to Express's global error handler.
 *
 * Usage:
 *   router.get("/route", asyncHandler(async (req, res) => {
 *       const data = await SomeModel.find({});
 *       res.json({ success: true, data });
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
