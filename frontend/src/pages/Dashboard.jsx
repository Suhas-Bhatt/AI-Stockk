/**
 * 📊 DASHBOARD PAGE
 * This is the central hub of your application.
 * It provides a high-level overview of market data using real-time charts.
 */

import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

export default function Dashboard() {
    const navigate = useNavigate();

    // 🔐 AUTH CHECK (ADDED)
    useEffect(() => {
        const user = localStorage.getItem("user");

        if (!user) {
            navigate("/"); // redirect to login
        }
    }, [navigate]);

    // 🧠 LIVE DATA STATE
    const [liveData, setLiveData] = useState([100, 105, 110, 115, 120, 118, 125, 130]);

    // 🔄 LIVE UPDATE
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveData((prev) => {
                const newVal = prev[prev.length - 1] + (Math.random() * 10 - 5);
                return [...prev.slice(1), Math.round(newVal)];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // 📰 MOCK DATA (Live News moved to LatestNews.jsx)
    const newsFeed = [
        { stock: "ADANIPORTS", type: "BUY", msg: "High Volume Breakout Detected", time: "Just now" },
        { stock: "AXISBANK", type: "SELL", msg: "Major Sell-off in Banking Sector", time: "2m ago" },
        { stock: "RELIANCE", type: "HOLD", msg: "Awaiting Quarterly Earnings", time: "15m ago" },
        { stock: "TCS", type: "BUY", msg: "Positive European Guidance", time: "1h ago" },
    ];

    // 🏁 STATS
    const stats = [
        { label: "Active Stocks", value: "48", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Buy Alerts", value: "+12", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Sell Signals", value: "3", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
        { label: "Market Cap", value: "₹125.4T", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Market Intelligence
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Monitoring Indian Equity Markets in Real-time
                        </p>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card p-6 rounded-3xl"
                        >
                            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <p className="text-slate-500 text-sm font-semibold">{stat.label}</p>
                            <h2 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h2>
                        </motion.div>
                    ))}
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-8">
                            Volatility Index (VIX)
                        </h3>

                        <div className="h-72">
                            <Line
                                data={{
                                    labels: Array(liveData.length).fill(''),
                                    datasets: [{
                                        data: liveData,
                                        borderColor: '#2563eb',
                                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                                        tension: 0.4,
                                        fill: true,
                                        pointRadius: 0
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                    </div>

                    {/* --- RIGHT PANEL: LIVE MARKET FEED (Takes 1/3 of space) --- */}
                    <div className="glass-card p-8 rounded-3xl flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Live AI Market Feed
                        </h3>

                        <div className="flex-1 space-y-4 overflow-hidden">
                            {newsFeed.map((feed, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.15 }}
                                    className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800 text-sm">{feed.stock}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${feed.type === 'BUY' ? 'bg-green-100 text-green-700' :
                                            feed.type === 'SELL' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {feed.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">{feed.msg}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 text-right">{feed.time}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}