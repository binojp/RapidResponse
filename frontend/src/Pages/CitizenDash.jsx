import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  LogOut,
  Filter,
  ThumbsUp,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Plus,
  User,
  Search,
  Bell,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

function CitizenDash() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    verified: "all",
    severity: "all",
  });
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch Incidents with useCallback to prevent unnecessary re-renders
  const fetchIncidents = useCallback(
    async (showLoading = false) => {
      if (!token) return;
      if (showLoading) setIsRefreshing(true);

      try {
        let url = `${import.meta.env.VITE_API_URL}/api/incidents`;
        const params = new URLSearchParams();

        if (filters.type !== "all") params.append("type", filters.type);
        if (filters.verified === "verified") params.append("verified", "true");
        if (filters.verified === "unverified")
          params.append("verified", "false");
        if (userLocation && radius) {
          params.append("latitude", userLocation.lat);
          params.append("longitude", userLocation.lon);
          params.append("radius", radius);
        }

        const response = await axios.get(`${url}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let filtered = response.data;
        if (filters.severity !== "all") {
          filtered = filtered.filter(
            (inc) => inc.severity === filters.severity
          );
        }
        setIncidents(filtered);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    },
    [token, filters, userLocation, radius]
  );

  // Initial Load + Auto-Polling
  useEffect(() => {
    fetchIncidents(true);
    const interval = setInterval(() => fetchIncidents(false), 10000); // 10s Auto-fetch
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // Secure Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        (err) =>
          console.warn("Location access denied. Radius filters disabled."),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  const getStatusIcon = (status) => {
    const iconClass = "w-5 h-5 flex-shrink-0"; // Added flex-shrink-0
    switch (status) {
      case "Resolved":
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case "In Progress":
        return <Clock className={`${iconClass} text-blue-500`} />;
      default:
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
    }
  };

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <ShieldAlert className="text-white w-6 h-6 flex-shrink-0" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              CitizenWatch
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search incidents..."
                className="bg-transparent border-none outline-none text-sm w-40"
              />
            </div>

            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {userStats.name || "User Account"}
                </p>
                <p className="text-[10px] font-medium text-green-600 uppercase tracking-wider">
                  Active Now
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-slate-600">
                <User size={20} />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex flex-col lg:flex-row gap-8">
        {/* --- LEFT SIDEBAR (FILTERS) --- */}
        <aside className="lg:w-72 flex-shrink-0 space-y-6">
          <button
            onClick={() => navigate("/incident/report")}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Plus size={20} /> Report Incident
          </button>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Filter size={18} className="text-red-600" /> Filters
              </h3>
              {isRefreshing && (
                <RefreshCw size={14} className="animate-spin text-slate-400" />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Incident Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="accident">Accident</option>
                  <option value="fire">Fire</option>
                  <option value="crime">Crime</option>
                  <option value="medical">Medical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Severity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["all", "High", "Medium", "Low"].map((sev) => (
                    <button
                      key={sev}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, severity: sev }))
                      }
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        filters.severity === sev
                          ? "bg-red-50 border-red-200 text-red-600"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {userLocation && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">
                    Radius: <span className="text-red-600">{radius} km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* --- MAIN FEED (THE PART YOU LIKED) --- */}
        <main className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Live Emergency Feed
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
            </h2>
            <p className="text-xs text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              Auto-updating
            </p>
          </div>

          <div className="space-y-4">
            {incidents.length > 0 ? (
              incidents.map((incident) => (
                <div
                  key={incident._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    {/* Fixed Icon logic - no shrinking */}
                    <div className="mt-1 flex-shrink-0">
                      {getStatusIcon(incident.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          {incident.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-tighter border ${
                            incident.severity === "High"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}
                        >
                          {incident.severity}
                        </span>
                        {incident.isVerified ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                            <ShieldCheck size={12} className="flex-shrink-0" />{" "}
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                            <ShieldAlert size={12} className="flex-shrink-0" />{" "}
                            Unverified
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2">
                        {incident.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <MapPin
                            size={14}
                            className="text-red-500 flex-shrink-0"
                          />
                          <span className="truncate max-w-[150px]">
                            {incident.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                          <Clock size={14} className="flex-shrink-0" />
                          {new Date(incident.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-xs border border-slate-100">
                        <ThumbsUp size={14} className="flex-shrink-0" />
                        {incident.upvotes?.length || 0}
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/citizen/incident/${incident._id}`)
                        }
                        className="p-2 bg-slate-900 text-white rounded-xl hover:bg-red-600 transition-all shadow-sm flex justify-center"
                      >
                                  <Eye size={16} className="flex-shrink-0" />
                        
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">
                  No incidents detected
                </h3>
                <p className="text-slate-500 text-sm">
                  Everything seems quiet in your current radius.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CitizenDash;
