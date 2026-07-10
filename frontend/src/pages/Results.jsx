/**
 * 📈 RESULTS / PREDICTIONS PAGE (v2.0)
 * Displays AI-generated BUY/HOLD/SELL recommendations from MongoDB.
 * Features: auto-polling, filter, dismiss, delete, search.
 */

import { useEffect, useState, useRef } from "react";
import { getRecommendations, deleteResult } from "../services/api";
import StockCard from "../components/StockCard";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, BarChart3, Loader2, X, RotateCcw, Search, Trash2 } from "lucide-react";

export default function Results() {
    const [data, setData] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [error, setError]   = useState("");
    const [deleting, setDeleting] = useState(null);

    // Persist dismissed cards in localStorage
    const [hiddenSymbols, setHiddenSymbols] = useState(() => {
        try {
            const saved = localStorage.getItem("dismissedStocks");
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const pollRef = useRef(null);

    // ── Fetch from MongoDB backend ────────────────────────────────────────────
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getRecommendations({ limit: 100 });

            // New backend returns: { success, data: [], pagination: {} }
            const items = Array.isArray(res.data) ? res.data : [];
            setData(items);
            setError("");

            // Stop polling if no PENDING items remain
            const hasPending = items.some(item => item.recommendation === "PENDING");
            if (!hasPending && pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
                setPolling(false);
            } else if (hasPending) {
                setPolling(true);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Could not reach the prediction engine backend.");
        } finally {
            setLoading(false);
        }
    };

    // ── Auto-polling every 5 seconds for pending results ─────────────────────
    useEffect(() => {
        fetchData();
        setPolling(true);
        pollRef.current = setInterval(fetchData, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    // ── Dismiss a card (UI only, persisted in localStorage) ──────────────────
    const dismissStock = (e, symbol) => {
        e.stopPropagation();
        setHiddenSymbols(prev => {
            const updated = [...prev, symbol];
            localStorage.setItem("dismissedStocks", JSON.stringify(updated));
            return updated;
        });
    };

    // ── Delete from MongoDB ───────────────────────────────────────────────────
    const handleDelete = async (e, symbol) => {
        e.stopPropagation();
        if (!window.confirm(`Delete result for ${symbol}?`)) return;
        try {
            setDeleting(symbol);
            await deleteResult(symbol);
            setData(prev => prev.filter(s => s.symbol !== symbol));
        } catch (err) {
            alert("Could not delete result. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    const clearSession = () => {
        const all = data.map(item => item.symbol);
        setHiddenSymbols(all);
        localStorage.setItem("dismissedStocks", JSON.stringify(all));
    };

    const restoreAll = () => {
        setHiddenSymbols([]);
        localStorage.removeItem("dismissedStocks");
    };

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filtered = data.filter(item => {
        const sym = item.symbol || "";
        const matchesFilter = filter === "ALL" || item.recommendation === filter;
        const matchesSearch = !search || sym.includes(search.toUpperCase());
        const notHidden     = !hiddenSymbols.includes(sym);
        return matchesFilter && matchesSearch && notHidden;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Predictions</h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Real-time Analytical Results
                            {polling && <span className="ml-2 text-blue-500 text-xs font-bold animate-pulse">● LIVE</span>}
                        </p>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        {filtered.length > 0 && (
                            <button onClick={clearSession}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-black hover:bg-red-100 transition shadow-sm">
                                <X className="w-3.5 h-3.5" /> Clear View
                            </button>
                        )}
                        {hiddenSymbols.length > 0 && (
                            <button onClick={restoreAll}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-100 transition shadow-sm">
                                <RotateCcw className="w-3.5 h-3.5" /> Restore ({hiddenSymbols.length})
                            </button>
                        )}
                        <button onClick={fetchData}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm">
                            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* SEARCH + FILTER */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    {/* Search bar */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                        />
                    </div>

                    {/* Filter buttons */}
                    {["ALL", "BUY", "HOLD", "SELL"].map(type => (
                        <button key={type} onClick={() => setFilter(type)}
                            className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 border ${
                                filter === type
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                            }`}>
                            {type}
                        </button>
                    ))}
                </div>

                {/* RESULTS GRID */}
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <div className="text-center">
                            <p className="text-slate-800 font-black text-lg">AI Pipeline is Processing...</p>
                            <p className="text-slate-400 text-sm mt-1">The XGBoost engine is analyzing your dataset.</p>
                            <p className="text-blue-500 text-xs font-bold mt-3 uppercase tracking-widest">Auto-refreshing every 5 seconds</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 font-bold bg-red-50 p-6 rounded-2xl border border-red-100">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <BarChart3 className="w-12 h-12 text-slate-200 mx-auto" />
                        <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-[10px]">No Signals Detected</p>
                        <p className="text-slate-400 text-sm mt-2">Upload a CSV file and run the pipeline to see results.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filtered.map((stock) => {
                                const symbol = stock.symbol;
                                return (
                                    <motion.div
                                        key={symbol}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative group/card"
                                    >
                                        {/* Dismiss button */}
                                        <button onClick={(e) => dismissStock(e, symbol)} title="Hide"
                                            className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-slate-500 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/card:opacity-100 transition-all duration-200">
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete from DB button */}
                                        <button onClick={(e) => handleDelete(e, symbol)} title="Delete from database"
                                            disabled={deleting === symbol}
                                            className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/card:opacity-100 transition-all duration-200">
                                            {deleting === symbol
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <Trash2 className="w-3.5 h-3.5" />}
                                        </button>

                                        <StockCard
                                            stock={{
                                                ...stock,
                                                stock: symbol,
                                                score: stock.final_score || 0
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
