/**
 * 🛰️ FRONTEND API SERVICE (v2.0)
 * Complete API client for the Express.js + MongoDB backend.
 * Features: Axios interceptors for auto-logout on 401, all new endpoints.
 */

import axios from "axios";

// ── Base URL ──────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// ── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" }
});

// ── Request Interceptor: Attach JWT token automatically ───────────────────────
api.interceptors.request.use(
    (config) => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
            }
        } catch (e) {
            console.error("Error reading token:", e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor: Auto-logout on 401 Unauthorized ────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear session and redirect to login
            localStorage.removeItem("user");
            localStorage.removeItem("favoriteStocks");
            localStorage.removeItem("dismissedStocks");
            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

// ════════════════════════════════════════════════════════════════════════════════
// AUTH APIs
// ════════════════════════════════════════════════════════════════════════════════

/** Register new user */
export const signupUser = async (name, email, password) => {
    const response = await api.post("/auth/signup", { name, email, password });
    return response.data;
};

/** Login user → returns { token, user } */
export const loginUser = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
};

/** Start a guest session */
export const guestLogin = async () => {
    const response = await api.post("/auth/guest");
    return response.data;
};

/** Logout (client-side cleanup + server notification) */
export const logoutUser = async () => {
    try {
        await api.post("/auth/logout");
    } catch {
        // Non-fatal — always clear client storage
    } finally {
        localStorage.removeItem("user");
        localStorage.removeItem("favoriteStocks");
        localStorage.removeItem("dismissedStocks");
    }
};

/** Get current user profile */
export const getMe = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};

/** Update profile (name, avatar, phone) */
export const updateProfile = async (updates) => {
    const response = await api.put("/auth/profile", updates);
    return response.data;
};

// ════════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD & PIPELINE APIs
// ════════════════════════════════════════════════════════════════════════════════

/** Upload CSV file → returns { datasetId, fileUrl, filePath, symbol } */
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

/** Start AI pipeline → pipeline runs async, returns 202 immediately */
export const startPipeline = async (symbol, fileUrl, filePath, datasetId) => {
    const response = await api.post("/pipeline", { symbol, fileUrl, filePath, datasetId });
    return response.data;
};

// ════════════════════════════════════════════════════════════════════════════════
// RESULTS APIs
// ════════════════════════════════════════════════════════════════════════════════

/** Get all recommendations (paginated, filterable) */
export const getRecommendations = async (params = {}) => {
    const response = await api.get("/results", { params });
    return response.data; // { success, data: [], pagination: {} }
};

/** Get a single stock result */
export const getStockResult = async (symbol) => {
    const response = await api.get(`/results/${symbol}`);
    return response.data;
};

/** Get stats summary (BUY/HOLD/SELL counts) */
export const getResultsStats = async () => {
    const response = await api.get("/results/stats");
    return response.data;
};

/** Delete a stock result */
export const deleteResult = async (symbol) => {
    const response = await api.delete(`/results/${symbol}`);
    return response.data;
};

// ════════════════════════════════════════════════════════════════════════════════
// DATASETS APIs
// ════════════════════════════════════════════════════════════════════════════════

/** List user's uploaded datasets */
export const getDatasets = async (params = {}) => {
    const response = await api.get("/datasets", { params });
    return response.data;
};

/** Get single dataset details */
export const getDataset = async (id) => {
    const response = await api.get(`/datasets/${id}`);
    return response.data;
};

/** Update dataset metadata */
export const updateDataset = async (id, updates) => {
    const response = await api.put(`/datasets/${id}`, updates);
    return response.data;
};

/** Delete a dataset */
export const deleteDataset = async (id) => {
    const response = await api.delete(`/datasets/${id}`);
    return response.data;
};

// ════════════════════════════════════════════════════════════════════════════════
// WATCHLIST APIs (MongoDB-backed)
// ════════════════════════════════════════════════════════════════════════════════

/** Get user's watchlist */
export const getWatchlist = async () => {
    const response = await api.get("/watchlist");
    return response.data; // { success, data: { symbols: [] } }
};

/** Add stock to watchlist */
export const addToWatchlist = async (symbol) => {
    const response = await api.post(`/watchlist/${symbol}`);
    return response.data;
};

/** Remove stock from watchlist */
export const removeFromWatchlist = async (symbol) => {
    const response = await api.delete(`/watchlist/${symbol}`);
    return response.data;
};

// ════════════════════════════════════════════════════════════════════════════════
// CHATBOT API
// ════════════════════════════════════════════════════════════════════════════════

/** Send a message to the AI chatbot */
export const chatWithBedrock = async (prompt) => {
    const response = await api.post("/chatbot", { prompt });
    return response.data;
};

/** Get chatbot conversation history */
export const getChatHistory = async (params = {}) => {
    const response = await api.get("/chatbot/history", { params });
    return response.data;
};

export default api;
