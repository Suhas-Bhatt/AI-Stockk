/**
 * services/mailer.js
 * ====================
 * Replaces: AWS SNS email notifications
 *
 * Uses Nodemailer with Gmail SMTP (free, no limits for personal use).
 * Setup: Enable 2FA on Gmail → create an App Password → set in .env
 */

const nodemailer = require("nodemailer");

// ── Transporter (Gmail SMTP) ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,   // Gmail App Password (not your real password)
    },
});

/**
 * Send analysis complete alert
 * Mirrors the SNS publish in generate_recommendation.py
 */
async function sendAnalysisAlert({ symbol, recommendation, finalScore, revenue, profit, eps, sentiment }) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.log("📧 Mailer not configured — skipping email notification");
        return;
    }

    const emoji = recommendation === "BUY" ? "🟢" : recommendation === "SELL" ? "🔴" : "🟡";

    const mailOptions = {
        from:    `"AI Stock Engine" <${process.env.MAIL_USER}>`,
        to:      process.env.MAIL_TO || process.env.MAIL_USER,
        subject: `${emoji} Predictive Alert: ${symbol} — ${recommendation}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e293b;">🚀 Analysis Complete for <strong>${symbol}</strong></h2>
                <div style="background: #f8fafc; border-left: 4px solid ${
                    recommendation === "BUY" ? "#22c55e" :
                    recommendation === "SELL" ? "#ef4444" : "#f59e0b"
                }; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="font-size: 24px; font-weight: bold; margin: 0;">
                        ${emoji} ${recommendation}
                    </p>
                    <p style="color: #64748b; margin: 4px 0;">
                        Final Score: <strong>${(finalScore * 100).toFixed(1)}%</strong>
                    </p>
                </div>
                <h3>📊 Dashboard Data</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; color: #64748b;">Revenue Growth</td>
                        <td style="padding: 8px; font-weight: bold;">${revenue}%</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; color: #64748b;">Profit Margin</td>
                        <td style="padding: 8px; font-weight: bold;">${profit}%</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; color: #64748b;">EPS Trend</td>
                        <td style="padding: 8px; font-weight: bold;">₹${eps}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; color: #64748b;">Sentiment Index</td>
                        <td style="padding: 8px; font-weight: bold;">${sentiment}</td>
                    </tr>
                </table>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                    Powered by AI Stock Engine — Express.js + MongoDB + XGBoost + Gemini
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Alert email sent for ${symbol}`);
    } catch (err) {
        // Non-fatal: log but don't crash the pipeline
        console.error("📧 Email send failed (non-fatal):", err.message);
    }
}

module.exports = { sendAnalysisAlert };
