import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, LogOut, Menu, X } from "lucide-react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check login status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuth();
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener("storage", checkAuth);
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener("storage", checkAuth);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/login");
    setMobileOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return "/citizen/dashboard";
    if (user.role === "admin" || user.role === "superadmin") {
      return "/responder/dashboard";
    }
    return "/citizen/dashboard";
  };

  const getNavLinks = () => {
    if (!isLoggedIn) {
      // Public links
      return [
        { href: "/heatmap", label: "Incident Map" },
        { href: "/incident/report", label: "Report Incident" },
        { href: "/leaderboard", label: "Leaderboard" },
      ];
    }

    if (user?.role === "admin" || user?.role === "superadmin") {
      // Responder/Admin links
      return [
        { href: "/responder/dashboard", label: "Dashboard" },
        { href: "/heatmap", label: "Incident Map" },
        { href: "/leaderboard", label: "Leaderboard" },
      ];
    }

    // Citizen links
    return [
      { href: "/citizen/dashboard", label: "Dashboard" },
      { href: "/heatmap", label: "Incident Map" },
      { href: "/incident/report", label: "Report Incident" },
      { href: "/rewards", label: "Rewards" },
      { href: "/leaderboard", label: "Leaderboard" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-red-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink
              to={isLoggedIn ? getDashboardPath() : "/"}
              className="flex items-center space-x-2"
            >
              <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                RapidResponse
              </span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation links */}
            <nav className="flex items-center space-x-6">
              {navLinks.map(({ href, label }) => (
                <NavLink
                  key={href}
                  to={href}
                  className={({ isActive }) =>
                    isActive
                      ? "text-red-700 font-semibold"
                      : "text-red-600 hover:text-red-800 transition-colors"
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Auth Section */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-red-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {user?.name || "User"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.role === "admin" || user?.role === "superadmin"
                        ? "Responder"
                        : "Citizen"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <NavLink
                  to="/login"
                  className="px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 transition"
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded hover:from-red-700 hover:to-blue-700 transition"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-red-700 hover:bg-red-100 focus:outline-none"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden bg-white border-t border-red-200 transition-all duration-300 ${
          mobileOpen ? "block" : "hidden"
        }`}
      >
        <nav className="flex flex-col space-y-1 p-4">
          {/* Mobile navigation links */}
          {navLinks.map(({ href, label }) => (
            <NavLink
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-red-100 text-red-700 font-semibold"
                    : "text-red-600 hover:bg-red-50 hover:text-red-800"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile auth section */}
        <div className="border-t border-red-200 p-4">
          {isLoggedIn ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 pb-3 border-b border-red-200">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === "admin" || user?.role === "superadmin"
                      ? "Responder"
                      : "Citizen"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 text-center border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition"
              >
                Log In
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 text-center bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-md hover:from-red-700 hover:to-blue-700 transition"
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
