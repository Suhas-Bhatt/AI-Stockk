/**
 * 📁 UPLOAD PAGE
 * This page handles the ingestion of CSV datasets from the user.
 * It's the primary way to feed new stock data into the AWS Pipeline.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, startPipeline } from "../services/api"; // API Service to talk to Express backend
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function UploadPage() {
    // 🧠 STATE HOOKS
    // 'file' stores the actual CSV object selected by the user.
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stockCount, setStockCount] = useState(0);

    const navigate = useNavigate();

    // 📂 FILE SELECTION HANDLER
    // Runs as soon as the user selects a file from their computer.
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Security Check: Only allow CSV files
        if (!selectedFile.name.endsWith(".csv")) {
            setError("Invalid file format. Please upload a .csv file.");
            return;
        }

        setFile(selectedFile);
        setError("");

        // 🔍 PREVIEW LOGIC: Count how many stocks are in the file
        try {
            const text = await selectedFile.text();
            const rows = text.split("\n").filter(Boolean);
            setStockCount(rows.length > 0 ? rows.length - 1 : 0); // Subtract 1 for the header row
        } catch (err) {
            setError("Error reading file metadata.");
        }
    };

    // 🚀 UPLOAD HANDLER
    // Runs when the user clicks 'Sync with Prediction Engine'
    const handleUpload = async () => {
        if (!file) {
            setError("Please select a valid dataset first.");
            return;
        }

        try {
            setLoading(true);
            
            // 📤 1. Upload the raw CSV directly to the backend
            console.log("Uploading dataset to backend...");
            const uploadRes = await uploadFile(file);
            
            // 🚀 2. Start the Prediction Pipeline
            console.log("Triggering prediction pipeline...");
            await startPipeline(uploadRes.symbol, uploadRes.fileUrl);

            // ✅ 3. Success: Go to results to see the AI output
            navigate("/results");
        } catch (err) {
            console.error("Pipeline Error:", err);
            setError("Prediction Pipeline Error: Could not process dataset. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1 flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
                    
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Dataset Integration</h1>
                        <p className="text-slate-500 font-medium">Sync your Kaggle CSV datasets with the AI Prediction Engine</p>
                    </div>

                    <div className="glass-card p-12 rounded-[3rem] text-center relative overflow-hidden">
                        {/* 🖱️ HIDDEN INPUT
                            We hide the ugly default browser file input and trigger it using a 'label'.
                        */}
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept=".csv" />

                        {!file ? (
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer group py-10">
                                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl group-hover:bg-blue-600 transition-all duration-500">
                                    <Upload className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Choose Dataset</h3>
                                <p className="text-slate-400 text-sm italic">Click to browse your local storage</p>
                            </label>
                        ) : (
                            <div className="py-10">
                                <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mb-6 mx-auto shadow-xl">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">{file.name}</h3>
                                <p className="text-green-600 font-bold text-xs uppercase tracking-widest">{stockCount} Data Points Detected</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 flex items-center justify-center gap-2 text-red-500 bg-red-50 py-3 rounded-2xl border border-red-100">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-bold">{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className={`w-full mt-10 py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all ${
                                loading || !file ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white shadow-2xl"
                            }`}
                        >
                            {loading ? "Processing AI Signal..." : "Sync with AI Pipeline"}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>

                </motion.div>
            </main>
        </div>
    );
}