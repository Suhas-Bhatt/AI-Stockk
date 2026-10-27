import { chatWithBedrock } from "../services/api";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Chatbot() {
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hi 👋 Ask me anything about stocks or predictions." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // 🔥 CALL YOUR BACKEND (Bedrock Lambda API)
            const data = await chatWithBedrock(input);

            const botMsg = {
                role: "bot",
                // Depending on your API schema, the data might be in data.response, data.body, or directly data.
                text: data.response || data.body || "No response"
            };

            setMessages((prev) => [...prev, botMsg]);

        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: "bot", text: "⚠️ Error connecting to AI" }
            ]);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="page-container flex-1">

                {/* HEADER */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        AI Chatbot
                    </h1>
                    <p className="text-slate-500">
                        Ask anything about stocks, predictions & analytics
                    </p>
                </div>

                {/* CHAT CONTAINER */}
                <div className="glass-card rounded-3xl p-6 flex flex-col h-[75vh]">

                    {/* MESSAGES */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`flex items-start gap-3 max-w-[70%]`}>
                                    
                                    {msg.role === "bot" && (
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                            <Bot size={16} />
                                        </div>
                                    )}

                                    <div className={`px-4 py-3 rounded-2xl text-sm shadow whitespace-pre-wrap ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-slate-700"
                                    }`}>
                                        {msg.text}
                                    </div>

                                    {msg.role === "user" && (
                                        <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* INPUT BOX */}
                    <div className="mt-4 flex items-center gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about stocks..."
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={sendMessage}
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    {loading && (
                        <p className="text-xs text-slate-400 mt-2">AI is thinking...</p>
                    )}
                </div>
            </main>
        </div>
    );
}