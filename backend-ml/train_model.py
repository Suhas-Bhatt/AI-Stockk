"""
train_model.py
==============
Generates synthetic stock training data and trains an XGBoost model.
Run this ONCE to produce model.pkl before starting the FastAPI server.

Usage:
    python train_model.py
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import pickle
import os

np.random.seed(42)
N = 2000  # number of synthetic training samples

# ── Feature generation ────────────────────────────────────────────────────────
# revenue_growth (%):   -20 to +30
# profit_margin (%):   -10 to +40
# eps_trend (₹):         0.5 to  5.0
# sentiment_score:       0.0 to  1.0

revenue_growth  = np.random.uniform(-20,  30, N)
profit_margin   = np.random.uniform(-10,  40, N)
eps_trend       = np.random.uniform(  0.5, 5.0, N)
sentiment_score = np.random.uniform(  0.0, 1.0, N)

# ── Target: financial_score (0–1) ─────────────────────────────────────────────
# Based on same weighted formula used in generate_recommendation.py:
#   0.6 * financial_component + 0.4 * sentiment
# financial_component derived from normalised revenue + profit + EPS

financial_component = (
    (revenue_growth  + 20) / 50.0 * 0.4 +   # normalise to [0,1], weight 40%
    (profit_margin   + 10) / 50.0 * 0.4 +   # normalise to [0,1], weight 40%
    (eps_trend       -  0.5) / 4.5 * 0.2    # normalise to [0,1], weight 20%
)
financial_component = np.clip(financial_component, 0, 1)

# Final score (mirrors the AWS formula)
financial_score = (0.6 * financial_component) + (0.4 * sentiment_score)
financial_score = np.clip(financial_score, 0, 1)

# Add realistic noise
financial_score += np.random.normal(0, 0.02, N)
financial_score = np.clip(financial_score, 0, 1)

# ── Build DataFrame ───────────────────────────────────────────────────────────
df = pd.DataFrame({
    "revenue_growth":  revenue_growth,
    "profit_margin":   profit_margin,
    "eps_trend":       eps_trend,
    "sentiment_score": sentiment_score,
    "financial_score": financial_score,
})

X = df[["revenue_growth", "profit_margin", "eps_trend", "sentiment_score"]]
y = df["financial_score"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Train XGBoost ─────────────────────────────────────────────────────────────
model = XGBRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
preds = model.predict(X_test)
rmse  = mean_squared_error(y_test, preds, squared=False)
print(f"✅ Model trained successfully!")
print(f"   RMSE on test set: {rmse:.4f}")
print(f"   Sample predictions vs actuals:")
for pred, actual in zip(preds[:5], y_test.values[:5]):
    score = pred * 0.88  # apply same scale factor as original code
    rec   = "BUY" if score > 0.7 else ("SELL" if score < 0.4 else "HOLD")
    print(f"     pred={pred:.3f} → scaled={score:.3f} → {rec}  |  actual={actual:.3f}")

# ── Save model ────────────────────────────────────────────────────────────────
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
with open(model_path, "wb") as f:
    pickle.dump(model, f)
print(f"\n💾 Model saved to: {model_path}")
print("🚀 You can now start the FastAPI server with: uvicorn main:app --reload")
