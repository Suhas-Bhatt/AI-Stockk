import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { UserPlus, Mail, Lock, User, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { signupUser, guestLogin } from "../services/api";

/**
 * SIGNUP COMPONENT
 * This page allows new traders to create an account.
 * It uses standard validation and connects to the AWS Backend Auth pipeline.
 */
export default function Signup() {
    const navigate = useNavigate();

    // 🧠 STATE MANAGEMENT
    // We store user input in these 'state' variables
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // ⚡ SKIP ACTION — Guest mode, bypasses signup
    const handleSkip = async () => {
        try {
            const data = await guestLogin();
            localStorage.setItem("user", JSON.stringify(data));
            navigate("/dashboard");
        } catch (err) {
            setError("Could not connect to backend to start guest session.");
        }
    };

    // 🖐 SIGNUP HANDLER
    const handleSignup = async () => {
        setError("");

        // 🔍 Basic validation
        if (!name || !email || !password) {
            setError("All fields are required.");
            return;
        }

        // 📧 Email validation
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (!gmailRegex.test(email)) {
            setError("Only Gmail addresses (@gmail.com) are allowed.");
            return;
        }

        // 🔐 Password validation
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        // 🔥 Strong password (recommended)
        const strongPassword = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
        if (!strongPassword.test(password)) {
            setError("Password must contain at least one letter and one number.");
            return;
        }

        setLoading(true);

        try {
            const data = await signupUser(name, email, password);
            alert(data.message || "Signup successful! Please login.");
            navigate("/");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.error || "Signup failed. Try again.");
        }

        setLoading(false);
    };;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-900 px-4">

            {/* 🎭 ANIMATED CONTAINER */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                {/* 📦 THE GLASS CARD */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl p-10 border border-white/20 relative overflow-hidden">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                            <UserPlus className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Trade Account</h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Join ALPHA Stock Engine • AWS Secured 🛡️</p>
                    </div>

                    {/* ERROR ALERT */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* FORM INPUTS */}
                    <div className="space-y-5">
                        {/* Name Input */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="abc@gmail.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="Min. 6 characters"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTON */}
                    <button
                        onClick={handleSignup}
                        disabled={loading}
                        className={`w-full mt-10 py-5 rounded-[2rem] font-black text-white transition-all duration-300 flex items-center justify-center gap-3 ${loading ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/20 active:scale-[0.98]"
                            }`}
                    >
                        {loading ? "Starting Session..." : "Get Started Now"}
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

                    {/* FOOTER */}
                    <p className="text-center text-slate-400 text-xs mt-8">
                        Already have an account?
                        <Link to="/" className="text-blue-600 font-bold ml-1 hover:underline">Log in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
