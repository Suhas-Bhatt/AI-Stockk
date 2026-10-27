// import { useEffect, useState } from "react";
// import Sidebar from "../components/Sidebar";
// import { motion } from "framer-motion";
// import { Globe, Loader2, ArrowRight } from "lucide-react";

// export default function LatestNews() {
//     const [newsFeed, setNewsFeed] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchNews = async () => {
//             try {
//                 // Fetch latest global financial news (limit 15 for a full page grid)
//                 const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "IJ4ETO9O1UDEJPEK";
//                 const response = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&sort=LATEST&limit=15&apikey=${API_KEY}`);
//                 const data = await response.json();
                
//                 if (data.feed && data.feed.length > 0) {
//                     const formattedNews = data.feed.map(item => {
//                         const sentiment = item.overall_sentiment_label;
//                         let type = "HOLD";
//                         if (sentiment === "Bullish" || sentiment === "Somewhat-Bullish") type = "BUY";
//                         if (sentiment === "Bearish" || sentiment === "Somewhat-Bearish") type = "SELL";
                        
//                         let stockSymbol = "MARKET";
//                         if (item.ticker_sentiment && item.ticker_sentiment.length > 0) {
//                             stockSymbol = item.ticker_sentiment[0].ticker;
//                         }

//                         let timeStr = "Recently";
//                         if (item.time_published) {
//                             const hh = item.time_published.substring(9, 11);
//                             const mm = item.time_published.substring(11, 13);
//                             timeStr = `${hh}:${mm} UTC`;
//                         }

//                         return {
//                             stock: stockSymbol,
//                             type: type,
//                             title: item.title,
//                             summary: item.summary,
//                             source: item.source,
//                             time: timeStr,
//                             url: item.url
//                         };
//                     });
//                     setNewsFeed(formattedNews);
//                 } else {
//                     throw new Error("Rate Limited");
//                 }
//             } catch (e) {
//                 // Fallback realistic mock data in case Alpha Vantage 5-calls/min limit is hit
//                 setNewsFeed([
//                     { stock: "ADANIPORTS", type: "BUY", title: "High Volume Breakout Detected Ahead of Earnings", summary: "Market analysts are predicting a massive surge in volume as the conglomerate prepares for its quarterly announcements.", source: "Financial Times", time: "Just now", url: "#" },
//                     { stock: "AXISBANK", type: "SELL", title: "Major Sell-off in Banking Sector Triggers Concerns", summary: "Liquidity crunch hits the banking sector hard today, leading to widespread sell-offs across major Indian financial institutions.", source: "Bloomberg", time: "2m ago", url: "#" },
//                     { stock: "RELIANCE", type: "HOLD", title: "Awaiting Quarterly Earnings Report From Jio Platforms", summary: "Investors are holding steady before the big announcement regarding 5G monetization revenues from Jio.", source: "Reuters", time: "15m ago", url: "#" },
//                     { stock: "TCS", type: "BUY", title: "Positive European Guidance Boosts AI Investment", summary: "Tech stocks rally as TCS leads the charge with massive AI deals signed with top European retail chains.", source: "CNBC", time: "1h ago", url: "#" },
//                     { stock: "INFY", type: "HOLD", title: "Infosys Consolidates After Recent Management Changes", summary: "The stock trades sideways as the market prices in the recent structural changes at the top level.", source: "MoneyControl", time: "3h ago", url: "#" },
//                     { stock: "WIPRO", type: "SELL", title: "Wipro Faces Margin Pressures Downwards", summary: "Margin reductions due to high attrition rates have caused investors to sour on the stock this week.", source: "Economic Times", time: "5h ago", url: "#" }
//                 ]);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchNews();
//     }, []);

//     return (
//         <div className="min-h-screen bg-slate-50 flex">
//             <Sidebar />
//             <main className="page-container flex-1">
//                 <div className="flex justify-between items-center mb-10">
//                     <div>
//                         <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
//                             <Globe className="text-blue-600 w-8 h-8" />
//                             Live Market News
//                         </h1>
//                         <p className="text-slate-500 font-medium text-sm mt-1">
//                             Real-time AI Sentiment Analysis from Global Financial Outlets
//                         </p>
//                     </div>
//                 </div>

//                 {loading ? (
//                     <div className="flex flex-col items-center justify-center py-32 gap-6">
//                         <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
//                         <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Scanning Global News...</p>
//                     </div>
//                 ) : (
//                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//                         {newsFeed.map((feed, i) => (
//                             <motion.div
//                                 key={i}
//                                 initial={{ opacity: 0, scale: 0.95, y: 10 }}
//                                 animate={{ opacity: 1, scale: 1, y: 0 }}
//                                 transition={{ delay: i * 0.05 }}
//                                 className="glass-card p-6 flex flex-col justify-between rounded-3xl group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
//                             >
//                                 <div>
//                                     <div className="flex items-start justify-between mb-4">
//                                         <div className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
//                                             {feed.source || "Global News"}
//                                         </div>
//                                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg shadow-sm border ${
//                                             feed.type === 'BUY' ? 'bg-green-50 text-green-700 border-green-200' :
//                                             feed.type === 'SELL' ? 'bg-red-50 text-red-700 border-red-200' :
//                                             'bg-amber-50 text-amber-700 border-amber-200'
//                                         }`}>
//                                             {feed.type} | {feed.stock.length > 8 ? feed.stock.substring(0,8) : feed.stock}
//                                         </span>
//                                     </div>
//                                     <h2 className="text-lg font-bold text-slate-800 leading-snug mb-3 group-hover:text-blue-600 transition-colors">
//                                         {feed.title}
//                                     </h2>
//                                     <p className="text-sm text-slate-500 line-clamp-3 mb-6">
//                                         {feed.summary}
//                                     </p>
//                                 </div>
//                                 <div className="flex items-center justify-between pt-4 border-t border-slate-100">
//                                     <span className="text-xs font-bold text-slate-400">{feed.time}</span>
//                                     {feed.url !== "#" ? (
//                                         <a href={feed.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-2 rounded-xl">
//                                             Read Full <ArrowRight className="w-3 h-3" />
//                                         </a>
//                                     ) : (
//                                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 px-3 py-2 rounded-xl">Alpha Vantage Mock</span>
//                                     )}
//                                 </div>
//                             </motion.div>
//                         ))}
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { Globe, Loader2, ArrowRight } from "lucide-react";

export default function LatestNews() {
    const [newsFeed, setNewsFeed] = useState([]);
    const [filteredFeed, setFilteredFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "IJ4ETO9O1UDEJPEK";
                const response = await fetch(
                    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&sort=LATEST&limit=15&apikey=${API_KEY}`
                );
                const data = await response.json();

                if (data.feed && data.feed.length > 0) {
                    const formattedNews = data.feed.map(item => {
                        const sentiment = item.overall_sentiment_label;
                        let type = "HOLD";

                        if (sentiment === "Bullish" || sentiment === "Somewhat-Bullish") type = "BUY";
                        if (sentiment === "Bearish" || sentiment === "Somewhat-Bearish") type = "SELL";

                        let stockSymbol = "MARKET";
                        if (item.ticker_sentiment && item.ticker_sentiment.length > 0) {
                            stockSymbol = item.ticker_sentiment[0].ticker;
                        }

                        let timeStr = "Recently";
                        if (item.time_published) {
                            const hh = item.time_published.substring(9, 11);
                            const mm = item.time_published.substring(11, 13);
                            timeStr = `${hh}:${mm} UTC`;
                        }

                        return {
                            stock: stockSymbol,
                            type,
                            title: item.title,
                            summary: item.summary,
                            source: item.source,
                            time: timeStr,
                            url: item.url
                        };
                    });

                    setNewsFeed(formattedNews);
                    setFilteredFeed(formattedNews);
                } else {
                    throw new Error("Rate Limited");
                }
            } catch (e) {
                const mockData = [
                    { stock: "ADANIPORTS", type: "BUY", title: "High Volume Breakout Detected Ahead of Earnings", summary: "Market analysts predict a surge.", source: "Financial Times", time: "Just now", url: "#" },
                    { stock: "AXISBANK", type: "SELL", title: "Major Sell-off in Banking Sector", summary: "Liquidity crunch impacts banks.", source: "Bloomberg", time: "2m ago", url: "#" },
                    { stock: "RELIANCE", type: "HOLD", title: "Awaiting Earnings Report", summary: "Investors cautious.", source: "Reuters", time: "15m ago", url: "#" }
                ];
                setNewsFeed(mockData);
                setFilteredFeed(mockData);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // 🔥 FILTER LOGIC
    const handleFilter = (type) => {
        setFilter(type);

        if (type === "ALL") {
            setFilteredFeed(newsFeed);
        } else {
            const filtered = newsFeed.filter(item => item.type === type);
            setFilteredFeed(filtered);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Globe className="text-blue-600 w-8 h-8" />
                            Live Market News
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            AI Sentiment Based Trading Signals
                        </p>
                    </div>
                </div>

                {/* 🔥 BUTTON FILTER SECTION */}
                <div className="flex gap-3 mb-8">
                    {["ALL", "BUY", "SELL", "HOLD"].map(btn => (
                        <button
                            key={btn}
                            onClick={() => handleFilter(btn)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                filter === btn
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border hover:bg-slate-100"
                            }`}
                        >
                            {btn}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-500 text-sm font-bold uppercase">
                            Scanning Global News...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredFeed.map((feed, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-6 flex flex-col justify-between rounded-3xl group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                            {feed.source || "Global News"}
                                        </div>

                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                                            feed.type === "BUY"
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : feed.type === "SELL"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}>
                                            {feed.type}
                                        </span>
                                    </div>

                                    <h2 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600">
                                        {feed.title}
                                    </h2>

                                    <p className="text-sm text-slate-500 line-clamp-3 mb-6">
                                        {feed.summary}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <span className="text-xs font-bold text-slate-400">
                                        {feed.time}
                                    </span>

                                    {feed.url !== "#" ? (
                                        <a
                                            href={feed.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-xl"
                                        >
                                            Read Full <ArrowRight className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-300 bg-slate-100 px-3 py-2 rounded-xl">
                                            Mock
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

