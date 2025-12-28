import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Filter,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  XCircle,
  Users,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Red marker for incidents
const incidentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function ResponderDash() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    verified: "all",
    severity: "all",
  });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [internalNote, setInternalNote] = useState("");

  const token = localStorage.getItem("token");

  const fetchIncidents = async () => {
    if (!token) return;

    try {
      let url = `${import.meta.env.VITE_API_URL}/api/incidents`;
      const params = new URLSearchParams();

      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.verified === "verified") params.append("verified", "true");
      if (filters.verified === "unverified") params.append("verified", "false");

      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter by severity if needed
      let filtered = response.data;
      if (filters.severity !== "all") {
        filtered = filtered.filter((inc) => inc.severity === filters.severity);
      }

      // Sort by priority: High severity first, then by creation time
      filtered.sort((a, b) => {
        const severityOrder = { High: 3, Medium: 2, Low: 1 };
        if (severityOrder[b.severity] !== severityOrder[a.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setIncidents(filtered);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to fetch incidents");
    }
  };

  const fetchDashboardStats = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/dashboard-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDashboardStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleVerify = async (incidentId) => {
    if (!token) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/incidents/${incidentId}/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchIncidents();
      if (selectedIncident?._id === incidentId) {
        fetchIncidentDetails(incidentId);
      }
    } catch (err) {
      console.error("Error verifying incident:", err);
      alert("Failed to verify incident");
    }
  };

  const handleStatusUpdate = async (incidentId, newStatus) => {
    if (!token) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/incidents/${incidentId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchIncidents();
      if (selectedIncident?._id === incidentId) {
        fetchIncidentDetails(incidentId);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const handleAddNote = async (incidentId) => {
    if (!internalNote.trim()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/incidents/${incidentId}/notes`,
        { note: internalNote },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInternalNote("");
      fetchIncidentDetails(incidentId);
    } catch (err) {
      console.error("Error adding note:", err);
      alert("Failed to add note");
    }
  };

  const fetchIncidentDetails = async (incidentId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/incidents/${incidentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedIncident(response.data);
    } catch (err) {
      console.error("Error fetching incident details:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
      fetchIncidents();
      setLoading(false);

      // Set up polling for live updates (every 5 seconds for responders)
      const interval = setInterval(() => {
        fetchIncidents();
        fetchDashboardStats();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      navigate("/login");
    }
  }, [token, filters]);

const getStatusIcon = (status = "") => {
  const s = status.toLowerCase();

  if (s === "resolved")
    return <CheckCircle className="w-5 h-5 text-green-500" />;

  if (s === "in progress") return <Clock className="w-5 h-5 text-blue-500" />;

  if (s === "verified")
    return <ShieldCheck className="w-5 h-5 text-blue-600" />;

  if (s === "rejected") return <XCircle className="w-5 h-5 text-red-500" />;

  if (s === "reported")
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;

  return <AlertCircle className="w-5 h-5 text-gray-400" />;
};


  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-700 border-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      accident: "Accident",
      medical: "Medical",
      fire: "Fire",
      infrastructure: "Infrastructure",
      crime: "Crime",
      natural_disaster: "Natural Disaster",
      other: "Other",
    };
    return labels[type] || type;
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {/* Compact Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">
                Responder Console
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Dispatch System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              <Calendar size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-600">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={fetchIncidents}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-sm transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="text-xs font-bold uppercase tracking-tight">
                Sync
              </span>
            </button>
          </div>
        </header>

        {/* High-Density Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon: <AlertTriangle size={16} />,
              label: "Critical",
              value: dashboardStats.incidentsToday || 0,
              text: "text-red-600",
              bg: "bg-red-50",
              border: "border-red-100",
            },
            {
              icon: <Eye size={16} />,
              label: "Pending",
              value: dashboardStats.needReview || 0,
              text: "text-amber-600",
              bg: "bg-amber-50",
              border: "border-amber-100",
            },
            {
              icon: <CheckCircle size={16} />,
              label: "Resolved",
              value: dashboardStats.resolvedToday || 0,
              text: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
            },
            {
              icon: <Users size={16} />,
              label: "Online",
              value: dashboardStats.totalActiveUsers || 0,
              text: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg bg-white border ${stat.border} shadow-sm`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`${stat.bg} ${stat.text} p-1.5 rounded`}>
                  {stat.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  {stat.label}
                </span>
              </div>
              <span className={`text-lg font-black ${stat.text}`}>
                {stat.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Compact Vertical Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-6">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
            <Filter className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Incident Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                Current Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                Verification
              </label>
              <select
                value={filters.verified}
                onChange={(e) =>
                  setFilters({ ...filters, verified: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
              >
                <option value="all">All Sources</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                Priority Level
              </label>
              <select
                value={filters.severity}
                onChange={(e) =>
                  setFilters({ ...filters, severity: e.target.value })
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-red-500 transition-all shadow-sm"
              >
                <option value="all">All Severity</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                All Incidents
              </h2>
              <div className="space-y-4">
                {incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <div
                      key={incident._id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                        selectedIncident?._id === incident._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-red-200"
                      }`}
                      onClick={() =>
                        navigate(`/responder/incident/${incident._id}`)
                      }
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(incident.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-800">
                              {incident.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                                incident.severity
                              )}`}
                            >
                              {incident.severity}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                              {getTypeLabel(incident.type)}
                            </span>
                            {incident.isVerified ? (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 flex items-center gap-1">
                                <ShieldCheck size={12} /> Verified
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                <ShieldAlert size={12} /> Unverified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {incident.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="flex-shrink-0" />{" "}
                              {incident.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />{" "}
                              {new Date(incident.createdAt).toLocaleString()}
                            </span>
                            <span>ID: {incident.incidentId}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchIncidentDetails(incident._id);
                          }}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No incidents found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Incident Details Panel */}
          <div className="lg:col-span-1">
            {selectedIncident ? (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 mb-5 sm:p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Incident Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">
                      {selectedIncident.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedIncident.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                        selectedIncident.severity
                      )}`}
                    >
                      {selectedIncident.severity}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                      {getTypeLabel(selectedIncident.type)}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {selectedIncident.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="mb-1">
                      <MapPin size={14} className="inline mr-1" />
                      {selectedIncident.location}
                    </p>
                    <p className="mb-1">
                      <Clock size={14} className="inline mr-1" />
                      {new Date(selectedIncident.createdAt).toLocaleString()}
                    </p>
                    <p>ID: {selectedIncident.incidentId}</p>
                  </div>

                  {selectedIncident.mediaUrls &&
                    selectedIncident.mediaUrls.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">
                          Media
                        </h5>
                        <div className="space-y-2">
                          {selectedIncident.mediaUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg overflow-hidden"
                            >
                              {url.includes(".mp4") || url.includes(".webm") ? (
                                <video
                                  src={`${import.meta.env.VITE_API_URL}${url}`}
                                  controls
                                  className="w-full h-auto"
                                />
                              ) : (
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${url}`}
                                  alt={`Media ${idx + 1}`}
                                  className="w-full h-auto rounded-lg"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {!selectedIncident.isVerified && (
                      <button
                        onClick={() => handleVerify(selectedIncident._id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-sm"
                      >
                        Verify Incident
                      </button>
                    )}
                    <select
                      value={selectedIncident.status}
                      onChange={(e) =>
                        handleStatusUpdate(selectedIncident._id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Reported">Reported</option>
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Internal Notes */}
                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                      <MessageSquare size={16} /> Internal Notes
                    </h5>
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                      {selectedIncident.internalNotes &&
                      selectedIncident.internalNotes.length > 0 ? (
                        selectedIncident.internalNotes.map((note, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-2 rounded text-xs text-gray-600"
                          >
                            <p className="font-medium mb-1">
                              {note.addedBy?.name || "Unknown"}
                            </p>
                            <p>{note.note}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(note.addedAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">No notes yet</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Add internal note..."
                        className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddNote(selectedIncident._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddNote(selectedIncident._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 mb-5 sm:p-6">
                <p className="text-gray-500 text-center py-8">
                  Select an incident to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResponderDash;
