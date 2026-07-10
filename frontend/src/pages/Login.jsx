// 1️⃣ IMPORTS
// useNavigate is used to move users to another page after they login.
// Link is used to create clickable links between pages (like Signup).
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { loginUser, guestLogin } from "../services/api";

/**
 * 🔑 LOGIN PAGE
 * This is the first screen the user sees. 
 * It handles credentials and session management.
 */
export default function Login() {
    const navigate = useNavigate();

    // 🧠 STATE HOOKS (Internal Data)
    // We use useState to capture what the user types in the input boxes.
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setEmail("");
        setPassword("");
    }, []);

    // 🔄 AUTO-REDIRECT LOGIC
    // If the user is already logged in (token exists), we skip this page and go to dashboard.
    // useEffect(() => {
    //     if (localStorage.getItem("token")) {
    //         navigate("/dashboard");
    //     }
    // }, [navigate]);

    // ⚡ SKIP ACTION — Guest mode, bypasses authentication
    const handleSkip = async () => {
        try {
            const data = await guestLogin();
            localStorage.setItem("user", JSON.stringify(data));
            navigate("/dashboard");
        } catch (err) {
            setError("Could not connect to backend to start guest session.");
        }
    };

    // 🚀 LOGIN ACTION
    const handleLogin = async () => {
        setError("");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        if (!emailRegex.test(email)) {
            setError("Invalid email format");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            const data = await loginUser(email, password);

            localStorage.setItem("user", JSON.stringify(data));
            navigate("/dashboard");

        } catch (err) {
            setError("Invalid credentials");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-blue-900 px-4">

            {/* 🎭 FRAMER MOTION ANIMATION
                'initial' defines the starting state (hidden & shifted down)
                'animate' defines the ending state (visible & in position)
            */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-lg"
            >
                {/* 📦 THE LOGIN CARD
                    We use 'backdrop-blur' for that modern "glass" effect.
                */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 border border-white/20">

                    {/* Brand Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">AI Stock Engine</h1>
                        <p className="text-slate-400 text-sm mt-2 font-semibold">Log in to your terminal 📊</p>
                    </div>

                    {/* ERROR SECTION */}
                    {error && (
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black">
                            {error}
                        </motion.div>
                    )}

                    {/* FORM SECTION */}
                    <div className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1 mb-2 block">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="yourname@gmail.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-semibold text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1 mb-2 block">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="Enter secure password"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all font-semibold text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTON */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className={`w-full mt-10 py-5 rounded-[2rem] font-black text-white transition-all duration-300 flex items-center justify-center gap-3 ${loading ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95"
                            }`}
                    >
                        {loading ? "Connecting..." : "Login to Platform"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>

                    {/* SKIP BUTTON */}
                    <button
                        onClick={handleSkip}
                        className="w-full mt-4 py-4 rounded-[2rem] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Skip — Continue as Guest
                    </button>

                    {/* FOOTER NAVIGATION */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-xs font-semibold">
                            Don't have an account?
                            <Link to="/signup" className="text-blue-600 font-bold ml-1 hover:underline">Register Here</Link>
                        </p>
                    </div>

                </div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-2 mt-8 text-slate-500/50">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Secured by JWT + MongoDB Atlas</span>
                </div>
            </motion.div>
        </div>
    );
}