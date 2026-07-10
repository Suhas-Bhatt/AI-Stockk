# AI Stock Recommendation

![Dashboard Mockup](file:///C:/Users/Suhas/.gemini/antigravity-ide/brain/fa2b0a70-44de-4e18-af39-236c4bee62bf/dashboard_mockup_1783683228624.png)

## Overview
This repository hosts an **AI-powered stock recommendation platform**. The system provides real‑time stock analysis, predictive modeling, and an interactive web dashboard for traders and investors.

## Features
- **Data Ingestion**: Collects live market data from multiple APIs.
- **Machine Learning Models**: Uses regression and classification models to predict stock trends.
- **RESTful Backend**: Express.js services for data processing and recommendation endpoints.
- **Interactive Frontend**: Vite‑powered React UI with sleek dark‑theme dashboards, glass‑morphism cards, and dynamic charts.
- **User Management**: Secure authentication, chat history, and watchlist support.

## Architecture
```
AI Stock Recommendation
├─ backend-express (Node.js/Express API)
│   ├─ routes/            # REST endpoints
│   ├─ services/          # ML model integration, email, storage
│   └─ utils/             # Helper utilities
├─ backend-ml (Python)
│   ├─ train_model.py     # Model training script
│   └─ requirements.txt   # Python dependencies
└─ frontend (React/Vite)
    ├─ src/components/    # UI components (cards, charts, navbar)
    ├─ src/pages/         # Dashboard, results, analytics
    └─ src/assets/        # Images, icons
```

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

## Usage
```bash
# Start the backend API
cd backend-express && npm run dev

# Train or run the ML model
cd backend-ml && python train_model.py

# Launch the UI
cd frontend && npm run dev
```
Open your browser at `http://localhost:5173` to explore the dashboard.

## Contributing
Contributions are welcome! Please fork the repo, create a feature branch, and submit a pull request. Follow the existing code style and include unit tests where applicable.

## License
MIT License – see the [LICENSE](LICENSE) file for details.
