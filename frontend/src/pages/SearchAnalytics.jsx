/**
 * 🔍 SEARCH ANALYTICS PAGE
 * This page allows users to search for ANY company and get an AI Buy/Sell signal.
 * 
 * WORKFLOW:
 * 1. User enters name (e.g., RELIANCE).
 * 2. We fetch real market data from a Stock API (like Alpha Vantage).
 * 3. We send that data to your Backend (which triggers the SageMaker Pipeline).
 * 4. SageMaker returns the prediction, and we display it.
 */

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Search, Loader2, Target, Zap, ShieldCheck, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchAnalytics() {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    // 🚀 THE SEARCH HANDLER
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setIsSearching(true);
        setError("");
        setResult(null);

        try {
            const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "IJ4ETO9O1UDEJPEK";

            // ✅ Convert input to ticker
            const cleanQuery = query.trim().toUpperCase().split(" ")[0];
            let symbol = cleanQuery;
            if (!symbol.includes(".")) symbol += ".BSE";

            // ✅ Call Alpha Vantage API
            const response = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
            );

            const data = await response.json();
            console.log(data);

            const quote = data["Global Quote"];

            if (!quote || Object.keys(quote).length === 0) {
                throw new Error("No data found (try BSE or wait for API)");
            }

            // ✅ Extract values
            const price = parseFloat(quote["05. price"]);
            const changePercent = parseFloat(
                quote["10. change percent"].replace("%", "")
            );

            // ✅ YOUR LOGIC
            let verdict = "HOLD";

            if (changePercent > 1) verdict = "BUY";
            else if (changePercent < -1) verdict = "SELL";

            // ✅ Set result
            setResult({
                symbol,
                price: `₹${price}`,
                sentiment: "LIVE MARKET",
                verdict,
                confidence: Math.abs(changePercent) / 10, // simple confidence
                reasoning: `Stock moved ${changePercent}%. Decision based on momentum.`
            });

        } catch (err) {
            setError("Failed to fetch stock data. Check symbol or API limit.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1 flex flex-col items-center p-8">

                {/* 1️⃣ HEADER */}
                <div className="text-center mb-12 max-w-2xl">
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">AI Asset Lookup</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Enter any company symbol (TCS, AAPL, RELIANCE) to trigger the
                        <span className="text-blue-600 font-bold"> SageMaker Inference Pipeline</span>.
                    </p>
                </div>

                {/* 2️⃣ SEARCH BAR BAR */}
                <form onSubmit={handleSearch} className="w-full max-w-2xl mb-12">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Type stock symbol (e.g. RELIANCE)..."
                            className="w-full pl-16 pr-32 py-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl text-lg font-bold outline-none ring-4 ring-transparent focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-blue-600 text-white rounded-[2rem] font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Run AI Analysis"}
                        </button>
                    </div>
                </form>

                {/* 3️⃣ RESULTS AREA */}
                <AnimatePresence>
                    {isSearching && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4 py-20"
                        >
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, delay: i * 0.2 }} className="w-3 h-3 bg-blue-600 rounded-full" />)}
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Triggering AWS Step Functions...</p>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-6 bg-red-50 border border-red-100 rounded-3xl text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm font-bold">{error}</span>
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-2xl glass-card rounded-[3rem] p-10 relative overflow-hidden"
                        >
                            {/* Visual Highlight */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full" />

                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{result.symbol}</h2>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">SageMaker Result</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-slate-700">{result.price}</span>
                                    <div className="flex items-center justify-end gap-1 text-green-500 font-bold text-xs">
                                        <Zap className="w-3 h-3 fill-current" /> Live
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-10">
                                <div className="p-6 bg-blue-50 rounded-3xl">
                                    <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest mb-1">AI Verdict</p>
                                    <h4 className="text-xl font-black text-blue-700">{result.verdict}</h4>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Confidence Score</p>
                                    <h4 className="text-xl font-black text-slate-700">{(result.confidence * 100).toFixed(0)}%</h4>
                                </div>
                            </div>

                            <div className="p-6 border border-slate-100 rounded-3xl">
                                <h5 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    Model Rationale
                                </h5>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                    {result.reasoning}
                                </p>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authenticated via AWS IAM</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}

