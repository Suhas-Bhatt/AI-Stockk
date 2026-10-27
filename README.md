# AI Stock Recommendation

## Overview
This repository hosts an **AI-powered stock recommendation platform**. The system provides real‑time stock analysis, predictive modeling, and an interactive web dashboard for traders and investors.

## Features
- **Data Ingestion**: Collects live market data from multiple APIs.
- **Machine Learning Models**: XGBoost regression model served via a FastAPI microservice.
- **RESTful Backend**: Express.js services for auth, uploads, pipeline orchestration, and recommendations.
- **Interactive Frontend**: Vite‑powered React UI with sleek dark‑theme dashboards, glass‑morphism cards, and dynamic charts.
- **User Management**: JWT authentication, guest mode, chat history, and watchlist support.

## Architecture
```
AI Stock Recommendation
├─ backend-express (Node.js/Express API)
│   ├─ routes/            # REST endpoints (auth, upload, pipeline, results, chatbot, datasets, watchlist)
│   ├─ middleware/        # Auth, rate limiting, error handling, request logging
│   ├─ models/            # Mongoose schemas (User, Dataset, Result, ChatHistory)
│   ├─ services/          # ML client, email, storage (local/Cloudinary)
│   └─ config/            # MongoDB connection
├─ backend-ml (Python / FastAPI)
│   ├─ train_model.py     # Generates synthetic data + trains the XGBoost model → model.pkl
│   └─ main.py            # FastAPI microservice exposing POST /predict
└─ frontend (React 19 / Vite / Tailwind v4)
    ├─ src/pages/         # Login, Dashboard, Upload, Datasets, Results, Watchlist, StockDetails
    ├─ src/components/    # Sidebar, StockCard, etc.
    └─ src/services/api.js # Axios client (JWT auto-attach, 401 auto-logout)
```

Request flow: **Frontend → backend-express (REST API, MongoDB)** → **backend-ml (FastAPI, XGBoost `/predict`)**.

## Installation
```bash
# Clone the repository (already done)
# Install backend dependencies
cd backend-express && npm install

# Install ML dependencies
cd ../backend-ml && pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend && npm install
```

## Environment Variables
Copy `backend-express/.env.example` to `backend-express/.env` and fill in real values. **Never commit `.env`.**

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth token signing |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloud file storage (optional, falls back to local) |
| `GEMINI_API_KEY` | Chatbot LLM |
| `ALPHA_VANTAGE_KEY` | Market data |
| `ML_SERVICE_URL` | URL of the backend-ml FastAPI service |
| `MAIL_USER` / `MAIL_PASS` / `MAIL_TO` | Email notifications |
| `PORT` | Express server port (defaults to 3000) |

The frontend reads `VITE_API_BASE_URL` (defaults to `http://localhost:3000/api`) — set this as an env var before `npm run build`/`npm run dev` if the backend isn't on localhost.

## Usage (local development)
```bash
# 1. Train the ML model once (produces backend-ml/model.pkl)
cd backend-ml && python train_model.py

# 2. Start the ML microservice
uvicorn main:app --reload --port 8000

# 3. Start the backend API (in a new terminal)
cd backend-express && npm run dev

# 4. Launch the UI (in a new terminal)
cd frontend && npm run dev
```
Open your browser at `http://localhost:5173` to explore the dashboard. You can also click **"Skip — Continue as Guest"** on the login page to try it without an account (works even if the backend/ML service aren't running, using local sample data as a fallback).

## Deployment (GitHub + Render)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Suhas-Bhatt/AI-Stockk.git
git push -u origin main
```

### 2. Deploy on Render (auto-deploy on every push)
Create three separate services on [Render](https://dashboard.render.com), all pointing at this GitHub repo. Render auto-deploys by default whenever you push to the connected branch.

| Service | Type | Root Dir | Build Command | Start Command |
|---|---|---|---|---|
| `ai-stockk-ml` | Web Service (Python) | `backend-ml` | `pip install -r requirements.txt && python train_model.py` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| `ai-stockk-backend` | Web Service (Node) | `backend-express` | `npm install` | `npm start` |
| `ai-stockk-frontend` | Static Site | `frontend` | `npm install && npm run build` | Publish dir: `dist` |

Set environment variables on each service in the Render dashboard (**Environment** tab):
- `ai-stockk-backend`: all vars from `backend-express/.env.example`, plus `ML_SERVICE_URL` = the live URL of `ai-stockk-ml`, and `CLIENT_URL` = the live URL of `ai-stockk-frontend`.
- `ai-stockk-frontend`: `VITE_API_BASE_URL` = `https://<ai-stockk-backend-url>/api`.

A `render.yaml` blueprint is included at the repo root — you can instead use **New → Blueprint** in Render and point it at this repo to provision all three services at once (secret env vars will still need to be filled in manually in the dashboard).

## Contributing
Contributions are welcome! Please fork the repo, create a feature branch, and submit a pull request. Follow the existing code style and include unit tests where applicable.
