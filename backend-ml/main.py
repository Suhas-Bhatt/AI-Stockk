"""
main.py — FastAPI ML Microservice
===================================
Loads the trained XGBoost model and exposes a /predict endpoint.
Replaces the AWS SageMaker endpoint.

Deploy to Render.com as a Python web service.

Usage (local):
    uvicorn main:app --reload --port 8000
"""

import os
import pickle
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Load model ────────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print("✅ XGBoost model loaded successfully")
except FileNotFoundError:
    raise RuntimeError(
        "❌ model.pkl not found! Run `python train_model.py` first."
    )

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Stock Recommendation — ML Service",
    description="XGBoost financial scoring microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Schema ────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    revenue_growth:  float   # e.g.  5.0  (percent)
    profit_margin:   float   # e.g. 12.0  (percent)
    eps_trend:       float   # e.g.  1.5  (₹)
    sentiment_score: float   # e.g.  0.65 (0–1)

class PredictResponse(BaseModel):
    financial_score:    float
    final_score:        float
    recommendation:     str   # BUY | HOLD | SELL
    confidence_pct:     float # 0–100

# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "AI Stock ML Microservice", "model": "XGBoost"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ── Predict Endpoint ──────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        features = np.array([[
            req.revenue_growth,
            req.profit_margin,
            req.eps_trend,
            req.sentiment_score
        ]])

        # Raw XGBoost score (financial component)
        financial_score = float(np.clip(model.predict(features)[0], 0.0, 1.0))

        # Apply same weighted formula as original AWS code:
        # Final Score = 0.6 * Financial + 0.4 * Sentiment
        final_score = (0.6 * financial_score) + (0.4 * req.sentiment_score)

        # Apply realistic cap (mirrors original generate_recommendation.py)
        final_score = float(np.clip(final_score * 0.88, 0.0, 1.0))

        # Decision thresholds
        if final_score > 0.7:
            recommendation = "BUY"
        elif final_score < 0.4:
            recommendation = "SELL"
        else:
            recommendation = "HOLD"

        return PredictResponse(
            financial_score=round(financial_score, 4),
            final_score=round(final_score, 4),
            recommendation=recommendation,
            confidence_pct=round(final_score * 100, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
