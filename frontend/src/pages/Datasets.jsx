/**
 * 📊 DATASETS PAGE
 * Lists, manages, and deletes uploaded CSV datasets.
 * Backed by MongoDB — not localStorage.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDatasets, deleteDataset } from "../services/api";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Database, Trash2, RefreshCw, Loader2, FileText,
    CheckCircle2, Clock, XCircle, BarChart3, Upload
} from "lucide-react";

const statusConfig = {
    uploaded:   { label: "Uploaded",   color: "text-blue-600",  bg: "bg-blue-50",   icon: Clock },
    processing: { label: "Processing", color: "text-amber-600", bg: "bg-amber-50",  icon: Loader2 },
    processed:  { label: "Processed",  color: "text-green-600", bg: "bg-green-50",  icon: CheckCircle2 },
    failed:     { label: "Failed",     color: "text-red-600",   bg: "bg-red-50",    icon: XCircle }
};

const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function Datasets() {
    const navigate = useNavigate();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [deleting, setDeleting] = useState(null);

    const fetchDatasets = async () => {
        try {
            setLoading(true);
            const res = await getDatasets({ limit: 50 });
            setDatasets(res.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Could not load datasets. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDatasets(); }, []);

    const handleDelete = async (dataset) => {
        if (!window.confirm(`Delete dataset "${dataset.originalName}"? This cannot be undone.`)) return;
        try {
            setDeleting(dataset._id);
            await deleteDataset(dataset._id);
            setDatasets(prev => prev.filter(d => d._id !== dataset._id));
        } catch {
            alert("Failed to delete dataset. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <Database className="w-8 h-8 text-blue-600" />
                            My Datasets
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Manage your uploaded CSV stock datasets
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={fetchDatasets}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm">
                            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button onClick={() => navigate("/upload")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
                            <Upload className="w-4 h-4" />
                            Upload New
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                {loading && datasets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-medium">Loading datasets...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-600 font-bold p-6 rounded-2xl">
                        {error}
                    </div>
                ) : datasets.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                        <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-[10px]">No Datasets Yet</p>
                        <p className="text-slate-500 text-sm mt-2">Upload a CSV file to get started.</p>
                        <button onClick={() => navigate("/upload")}
                            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
                            Upload Dataset
                        </button>
                    </div>
                ) : (
                    <AnimatePresence>
                        <div className="space-y-4">
                            {datasets.map((dataset, i) => {
                                const statusCfg = statusConfig[dataset.status] || statusConfig.uploaded;
                                const StatusIcon = statusCfg.icon;

                                return (
                                    <motion.div
                                        key={dataset._id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex items-center gap-6"
                                    >
                                        {/* Icon */}
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-6 h-6 text-blue-600" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-bold text-slate-900 truncate">{dataset.originalName}</h3>
                                                <span className="text-xs font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">
                                                    {dataset.symbol || "—"}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400 font-semibold">
                                                <span>{formatBytes(dataset.fileSize)}</span>
                                                <span>{dataset.rowCount?.toLocaleString() || 0} rows</span>
                                                <span>{dataset.storageMode === "cloudinary" ? "☁ Cloudinary" : "💾 Local"}</span>
                                                <span>{new Date(dataset.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${statusCfg.bg}`}>
                                            <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.color} ${dataset.status === "processing" ? "animate-spin" : ""}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            {dataset.status === "processed" && (
                                                <button
                                                    onClick={() => navigate(`/results`)}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-black bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition"
                                                >
                                                    <BarChart3 className="w-3.5 h-3.5" /> View Results
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(dataset)}
                                                disabled={deleting === dataset._id}
                                                className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-50"
                                                title="Delete dataset"
                                            >
                                                {deleting === dataset._id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    );
}
