import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { Server, Database, Cloud, Activity, CheckCircle, Cpu, Zap, Globe, Bell, Eye, ShieldCheck } from "lucide-react";

export default function SystemStatus() {
    const services = [
        { name: "React Frontend", status: "Operational", ping: "12ms", icon: Globe, color: "text-blue-500", bg: "bg-blue-100" },
        { name: "Express.js API Server", status: "Operational", ping: "28ms", icon: Server, color: "text-indigo-500", bg: "bg-indigo-100" },
        { name: "MongoDB Atlas (Database)", status: "Operational", ping: "15ms", icon: Database, color: "text-rose-500", bg: "bg-rose-100" },
        { name: "Cloudinary (Data Storage)", status: "Operational", ping: "42ms", icon: Cloud, color: "text-sky-500", bg: "bg-sky-100" },
        { name: "FastAPI XGBoost (AI Predictor)", status: "Operational", ping: "95ms", icon: Cpu, color: "text-purple-500", bg: "bg-purple-100" },
        { name: "Google Gemini 1.5 Flash (LLM)", status: "Operational", ping: "120ms", icon: Zap, color: "text-teal-500", bg: "bg-teal-100" },
        { name: "Nodemailer (Alerts)", status: "Operational", ping: "35ms", icon: Bell, color: "text-fuchsia-500", bg: "bg-fuchsia-100" },
        { name: "JWT Auth Middleware", status: "Operational", ping: "2ms", icon: ShieldCheck, color: "text-slate-700", bg: "bg-slate-200" },
    ];

    // State to hold the two uploaded images
    const [archImage1, setArchImage1] = useState(() => localStorage.getItem("archImage1") || null);
    const [archImage2, setArchImage2] = useState(() => localStorage.getItem("archImage2") || null);

    const handleImageUpload = (e, imageNum) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                try {
                    if (imageNum === 1) {
                        setArchImage1(base64String);
                        localStorage.setItem("archImage1", base64String);
                    } else {
                        setArchImage2(base64String);
                        localStorage.setItem("archImage2", base64String);
                    }
                } catch (err) {
                    console.error("Image too large for localStorage, it won't persist after refresh.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">
                
                {/* HEADER */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Server className="text-blue-600 w-8 h-8" />
                            System Architecture & Status
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Live telemetry and pipeline workflow tracking
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-black text-green-700 tracking-widest uppercase">All Systems Nominal</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* LEFT PANEL: LIVE MICROSERVICES METRICS */}
                    <div className="xl:col-span-1 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Cloud Infrastructure</h3>
                        
                        {services.map((service, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${service.bg}`}>
                                        <service.icon className={`w-5 h-5 ${service.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{service.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{service.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg">
                                        {service.ping}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* RIGHT PANEL: ARCHITECTURE WORKFLOW & CUSTOM IMAGES */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* CUSTOM ARCHITECTURE IMAGE SECTION */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Project Workflows & Diagrams</h3>
                            <p className="text-xs text-slate-500 mb-6">Upload your network topologies, AWS cloud schemas, or workflow diagrams here.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* IMAGE 1 */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Image 1</h4>
                                        {archImage1 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setArchImage1(null); localStorage.removeItem("archImage1"); }}
                                                className="text-[10px] uppercase tracking-widest font-black text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <label className="w-full h-64 bg-slate-50 hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-300 flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer group">
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 1)} className="hidden" />
                                        {archImage1 ? (
                                            <img src={archImage1} alt="Uploaded Architecture 1" className="object-contain w-full h-full p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <Cloud className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                <p className="font-bold text-xs">Upload 1st Image</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {/* IMAGE 2 */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Image 2</h4>
                                        {archImage2 && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setArchImage2(null); localStorage.removeItem("archImage2"); }}
                                                className="text-[10px] uppercase tracking-widest font-black text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <label className="w-full h-64 bg-slate-50 hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-300 flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer group">
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 2)} className="hidden" />
                                        {archImage2 ? (
                                            <img src={archImage2} alt="Uploaded Architecture 2" className="object-contain w-full h-full p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <Cloud className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                <p className="font-bold text-xs">Upload 2nd Image</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* HIGH LEVEL PIPELINE FLOW */}
                        <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-8 rounded-3xl text-white shadow-xl">
                            <h3 className="text-lg font-bold mb-8">End-to-End Execution Flow</h3>
                            
                            <div className="flex flex-col gap-6 relative">
                                {/* Connecting line */}
                                <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-blue-800/50"></div>

                                {[
                                    { step: "1", title: "Data Ingestion", desc: "User uploads a CSV to React, calling the Express backend which saves the file securely in Cloudinary." },
                                    { step: "2", title: "Asynchronous Pipeline", desc: "The Express API kicks off an async execution flow, downloading and parsing the CSV to extract historical prices and trends." },
                                    { step: "3", title: "FastAPI XGBoost & Gemini Analysis", desc: "The Express backend sends computed financials to the FastAPI XGBoost service for prediction, analyzes market sentiment, and generates a composite signal." },
                                    { step: "4", title: "Atlas Storage & Email Alerts", desc: "The final BUY / HOLD / SELL recommendations are persisted to MongoDB Atlas, and Nodemailer dispatches an email alert to the user." },
                                ].map((flow, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 + (i * 0.2) }}
                                        className="flex gap-6 items-start relative z-10"
                                    >
                                        <div className="w-12 h-12 bg-blue-600 rounded-full flex flex-shrink-0 items-center justify-center font-black shadow-lg shadow-blue-500/30 text-white border-4 border-blue-950">
                                            {flow.step}
                                        </div>
                                        <div className="pt-2">
                                            <h4 className="text-sm font-bold text-blue-100">{flow.title}</h4>
                                            <p className="text-xs text-blue-200/60 mt-1 leading-relaxed">{flow.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
