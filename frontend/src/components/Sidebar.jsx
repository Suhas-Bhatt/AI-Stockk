import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../services/api";
import {
    LayoutDashboard,
    UploadCloud,
    BarChart3,
    TrendingUp,
    LogOut,
    ChevronRight,
    Search,
    Star,
    Globe,
    Server,
    MessageCircle,
    Database
} from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard",    path: "/dashboard",  icon: LayoutDashboard },
        { name: "Upload Data",  path: "/upload",     icon: UploadCloud },
        { name: "My Datasets",  path: "/datasets",   icon: Database },
        { name: "Predictions",  path: "/results",    icon: BarChart3 },
        { name: "Watchlist",    path: "/watchlist",  icon: Star },
        { name: "Latest News",  path: "/latestnews", icon: Globe },
        { name: "AI Analytics", path: "/analytics",  icon: Search },
        { name: "Architecture", path: "/status",     icon: Server },
        { name: "AI Chatbot",   path: "/chatbot",    icon: MessageCircle }
    ];

    const handleLogout = async () => {
        await logoutUser();
        navigate("/");
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f172a] text-slate-300 flex flex-col z-50 border-r border-slate-800">

            {/* LOGO */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <TrendingUp className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-white font-bold text-lg leading-none">ALPHA</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Stock Engine</p>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                    Core Platform
                </p>

                {menuItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <motion.button
                            key={item.name}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                                active
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "hover:bg-slate-800/50 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${
                                    active ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                                }`} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            {active && <ChevronRight className="w-4 h-4 text-blue-200" />}
                        </motion.button>
                    );
                })}
            </nav>

            {/* LOGOUT */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Log out</span>
                </button>
            </div>
        </aside>
    );
}