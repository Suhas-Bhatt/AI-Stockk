// Import navigation hook
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Highlight active route
    const isActive = (path) => location.pathname === path;

    return (
        // Navbar container
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

                {/* LEFT: Logo */}
                <div
                    onClick={() => navigate("/dashboard")}
                    className="text-lg font-semibold text-gray-800 cursor-pointer tracking-tight"
                >
                    AI Stock Engine 📊
                </div>

                {/* RIGHT: All actions (Upload + Results + Logout) */}
                <div className="flex items-center gap-3">

                    {/* Upload */}
                    <button
                        onClick={() => navigate("/upload")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition 
              ${isActive("/upload")
                                ? "bg-blue-500 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        Upload
                    </button>

                    {/* Results */}
                    <button
                        onClick={() => navigate("/results")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition 
              ${isActive("/results")
                                ? "bg-green-500 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        Results
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                        Logout
                    </button>

                </div>

            </div>
        </header>
    );
}