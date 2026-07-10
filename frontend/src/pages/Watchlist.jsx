/**
 * ⭐ WATCHLIST PAGE (v2.0)
 * User's favorite stocks — now backed by MongoDB (not localStorage).
 * Falls back gracefully for guests.
 */

import { useEffect, useState } from "react";
import { getRecommendations, getWatchlist, removeFromWatchlist } from "../services/api";
import StockCard from "../components/StockCard";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { Star, Loader2, RefreshCw, Trash2 } from "lucide-react";

export default function Watchlist() {
    const [allStocks, setAllStocks]   = useState([]);
    const [watchlist, setWatchlist]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState("");
    const [removing, setRemoving]     = useState(null);

    const isGuest = () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user?.isGuest || user?.user?.isGuest;
        } catch { return true; }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            if (isGuest()) {
                // Guests: read from localStorage
                const saved = JSON.parse(localStorage.getItem("favoriteStocks") || "[]");
                setWatchlist(saved);

                const res = await getRecommendations({ limit: 100 });
                setAllStocks(Array.isArray(res.data) ? res.data : []);
            } else {
                // Registered users: read from MongoDB
                const [stocksRes, watchRes] = await Promise.all([
                    getRecommendations({ limit: 100 }),
                    getWatchlist()
                ]);

                setAllStocks(Array.isArray(stocksRes.data) ? stocksRes.data : []);
                setWatchlist(watchRes.data?.symbols || []);
            }

            setError("");
        } catch (err) {
            console.error(err);
            setError("Could not load watchlist data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for localStorage watchlist updates from StockCard (guest mode)
        const handler = () => fetchData();
        window.addEventListener("favoritesUpdated", handler);
        return () => window.removeEventListener("favoritesUpdated", handler);
    }, []);

    const handleRemove = async (symbol) => {
        try {
            setRemoving(symbol);
            if (!isGuest()) {
                await removeFromWatchlist(symbol);
            } else {
                const updated = watchlist.filter(s => s !== symbol);
                localStorage.setItem("favoriteStocks", JSON.stringify(updated));
            }
            setWatchlist(prev => prev.filter(s => s !== symbol));
        } catch {
            alert("Could not remove from watchlist.");
        } finally {
            setRemoving(null);
        }
    };

    // Filter allStocks to only those in the watchlist
    const favoriteStocks = allStocks.filter(item =>
        watchlist.includes(item.symbol || item.stock)
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Star className="text-amber-500 w-8 h-8" fill="currentColor" />
                            My Watchlist
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Your hand-picked favourite stocks.
                            {isGuest() && (
                                <span className="ml-2 text-amber-600 text-xs font-bold">
                                    (Guest: stored locally — create an account to sync across devices)
                                </span>
                            )}
                        </p>
                    </div>

                    <button onClick={fetchData}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm">
                        <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* STATES */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-red-500 font-bold bg-red-50 p-6 rounded-2xl border border-red-100">{error}</div>
                ) : favoriteStocks.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <Star className="w-12 h-12 text-slate-200 mx-auto" />
                        <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-[10px]">No Favourites Yet</p>
                        <p className="text-slate-500 text-sm mt-2">Go to Predictions and click ⭐ to add stocks.</p>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {favoriteStocks.map((stock) => {
                            const symbol = stock.symbol || stock.stock;
                            return (
                                <motion.div
                                    key={symbol}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative group/card"
                                >
                                    {/* Remove button */}
                                    <button
                                        onClick={() => handleRemove(symbol)}
                                        disabled={removing === symbol}
                                        title="Remove from watchlist"
                                        className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/card:opacity-100 transition-all duration-200"
                                    >
                                        {removing === symbol
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>

                                    <StockCard
                                        hideStar={true}
                                        stock={{
                                            ...stock,
                                            stock: symbol,
                                            score: stock.final_score || stock.score || 0
                                        }}
                                    />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </main>
        </div>
    );
}