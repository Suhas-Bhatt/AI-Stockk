import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import Upload         from "./pages/Upload";
import Results        from "./pages/Results";
import Watchlist      from "./pages/Watchlist";
import Datasets       from "./pages/Datasets";
import StockDetails   from "./pages/StockDetails";
import SearchAnalytics from "./pages/SearchAnalytics";
import LatestNews     from "./pages/LatestNews";
import SystemStatus   from "./pages/SystemStatus";
import ChatBot        from "./pages/ChatBot";

/**
 * 🔒 PROTECTED ROUTE
 * Redirects unauthenticated users to login.
 */
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem("user");
    return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/"       element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/upload"    element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/results"   element={<ProtectedRoute><Results /></ProtectedRoute>} />
                <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                <Route path="/datasets"  element={<ProtectedRoute><Datasets /></ProtectedRoute>} />
                <Route path="/latestnews" element={<ProtectedRoute><LatestNews /></ProtectedRoute>} />
                <Route path="/status"    element={<ProtectedRoute><SystemStatus /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><SearchAnalytics /></ProtectedRoute>} />
                <Route path="/chatbot"   element={<ProtectedRoute><ChatBot /></ProtectedRoute>} />
                <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetails /></ProtectedRoute>} />

                {/* 404 fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
