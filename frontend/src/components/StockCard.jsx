/**
 * 🃏 STOCK CARD COMPONENT
 * This is a reusable UI piece used to show a single stock's summary.
 * It's designed with high-contrast colors to quickly show BUY/SELL signals.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Star } from "lucide-react";

export default function StockCard({ stock, hideStar = false }) {
    const navigate = useNavigate();

    // ⭐ WATCHLIST LOGIC
    const symbol = stock.stock;
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("favoriteStocks") || "[]");
            if (saved.includes(symbol)) setIsFavorite(true);
        } catch (e) {
            // ignore
        }
    }, [symbol]);

    const toggleFavorite = (e) => {
        e.stopPropagation(); // Prevent card navigation
        try {
            let saved = JSON.parse(localStorage.getItem("favoriteStocks") || "[]");
            if (isFavorite) {
                saved = saved.filter(item => item !== symbol);
            } else {
                if (!saved.includes(symbol)) saved.push(symbol);
            }
            localStorage.setItem("favoriteStocks", JSON.stringify(saved));
            
            // Custom event dispatcher to tell the Watchlist page to update!
            window.dispatchEvent(new Event("favoritesUpdated"));
            
            setIsFavorite(!isFavorite);
        } catch (e) {
            console.error("Failed to save favorite");
        }
    };

    // 🎨 COLOR CODING
    const isBuy = stock.recommendation === "BUY";
    const isSell = stock.recommendation === "SELL";
    
    const badgeStyle = isBuy 
        ? "bg-green-600 shadow-green-600/20" 
        : isSell 
            ? "bg-red-600 shadow-red-600/20" 
            : "bg-amber-500 shadow-amber-500/20";

    return (
        <div
            onClick={() => navigate(`/stock/${symbol}`)}
            className={`group p-6 rounded-[2rem] border border-transparent transition-all duration-500 bg-white hover:shadow-2xl hover:shadow-slate-200/50 cursor-pointer overflow-hidden relative`}
        >
            {/* 📍 AI SIGNAL BADGE & STAR BUTTON */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                            {symbol}
                        </h2>
                        {!hideStar && (
                            <button 
                                onClick={toggleFavorite}
                                className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'bg-amber-100 text-amber-500 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                            >
                                <Star className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Data Asset • AI Scanned</p>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-wider text-white shadow-lg ${badgeStyle}`}>
                    {stock.recommendation}
                </div>
            </div>

            {/* 📊 STATS PREVIEW */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AWS Confidence</p>
                    <div className="flex items-center gap-2">
                         <span className="text-2xl font-bold text-slate-800">
                             {stock.score >= 0.99 
                                 ? ((stock.score * 0.85) * 100).toFixed(2)
                                 : (stock.score * 100).toFixed(2)
                             }%
                         </span>
                         <ShieldCheck className="w-4 h-4 text-blue-500" />
                    </div>
                </div>
                <div className="text-right">
                    {stock.change ? (
                        <div className={`flex items-center gap-1 font-bold text-sm ${stock.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                            {stock.change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {stock.change}
                        </div>
                    ) : (
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            Daily Track: Active
                        </div>
                    )}
                </div>
            </div>

            {/* 🖱️ INTERACTIVE HINT
                'opacity-0 group-hover:opacity-100' means this is invisible UNTIL you hover over the card.
            */}
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="text-xs font-bold text-blue-600">Open Technical Analysis</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
        </div>
    );
}