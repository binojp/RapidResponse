import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ThumbsUp,
  User,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Configuration: Number of upvotes required for auto-verification
const UPVOTE_VERIFICATION_THRESHOLD = 1;

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const incidentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchIncident = async () => {
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/incidents/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIncident(response.data);
        // Check if user has upvoted
        if (response.data.upvotes && user.id) {
          setHasUpvoted(response.data.upvotes.some(
            (upvoteId) => upvoteId.toString() === user.id.toString()
          ));
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch incident");
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id, token, navigate, user.id]);

  const handleUpvote = async () => {
    if (!token || !incident) return;
    // Prevent users from upvoting their own incidents
    if (incident.user?._id?.toString() === user.id?.toString()) {
      return;
    }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/incidents/${id}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIncident((prev) => ({
        ...prev,
        upvotes: response.data.hasUpvoted
          ? [...(prev.upvotes || []), user.id]
          : prev.upvotes.filter((id) => id.toString() !== user.id.toString()),
        isVerified: response.data.isVerified,
      }));
      setHasUpvoted(response.data.hasUpvoted);
    } catch (err) {
      console.error("Error upvoting:", err);
    }
  };

  // Check if current user is the reporter
  const isReporter = incident?.user?._id?.toString() === user.id?.toString();

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in progress":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "verified":
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700";
      case "in progress":
        return "bg-blue-100 text-blue-700";
      case "verified":
        return "bg-blue-100 text-blue-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      accident: "Accident",
      medical: "Medical Emergency",
      fire: "Fire",
      infrastructure: "Infrastructure Failure",
      crime: "Crime",
      natural_disaster: "Natural Disaster",
      other: "Other",
    };
    return labels[type] || type;
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!incident)
    return (
      <div className="text-gray-500 text-center py-10">Incident not found</div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm border-b border-red-200 px-4 py-3 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            Incident Details
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Incident Info */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                {incident.title}
              </h2>
              <p className="text-gray-600 mb-4">{incident.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  incident.status
                )}`}
              >
                {getStatusIcon(incident.status)} {incident.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                  incident.severity
                )}`}
              >
                {incident.severity}
              </span>
              {incident.isVerified ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Verified
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                  <ShieldAlert size={14} /> Unverified
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-2">
                  <strong>Incident ID:</strong>
                  <span className="font-mono text-sm">{incident.incidentId}</span>
                </div>
                <div>
                  <strong>Type:</strong> {getTypeLabel(incident.type)}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <strong>Location:</strong>{" "}
                    {incident.location || `${incident.latitude}, ${incident.longitude}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <strong>Reported By:</strong>{" "}
                    {incident.user
                      ? incident.user.name || incident.user.email || "Unknown User"
                      : "Unknown User"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <strong>Reported At:</strong>{" "}
                    {new Date(incident.createdAt).toLocaleString()}
                  </div>
                </div>
                {incident.verifiedBy && (
                  <div>
                    <strong>Verified By:</strong>{" "}
                    {incident.verifiedBy.name || incident.verifiedBy.email || "Admin"}
                    {incident.verifiedAt && (
                      <span className="text-sm text-gray-500">
                        {" "}on {new Date(incident.verifiedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Upvote Section */}
              {!isReporter && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleUpvote}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      hasUpvoted
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                  >
                    <ThumbsUp size={18} />
                    Upvote ({incident.upvotes?.length || 0})
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {incident.upvotes?.length >= UPVOTE_VERIFICATION_THRESHOLD
                      ? "This incident has been verified by community upvotes!"
                      : `${UPVOTE_VERIFICATION_THRESHOLD - (incident.upvotes?.length || 0)} more upvote${UPVOTE_VERIFICATION_THRESHOLD - (incident.upvotes?.length || 0) === 1 ? '' : 's'} needed for verification`}
                  </p>
                </div>
              )}
              {isReporter && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    <ThumbsUp size={18} />
                    <span>Upvotes: {incident.upvotes?.length || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    You cannot upvote your own incident
                  </p>
                </div>
              )}
            </div>

            {/* Media */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Media</h3>
              {incident.mediaUrls && incident.mediaUrls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {incident.mediaUrls.map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      {url.includes(".mp4") || url.includes(".webm") ? (
                        <video
                          src={`${import.meta.env.VITE_API_URL}${url}`}
                          controls
                          className="w-full h-48 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${url}`}
                          alt={`Incident media ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow hover:scale-105 transition-transform cursor-pointer"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No media available</p>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        {incident.latitude && incident.longitude && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 sm:p-6">
            <h3 className="font-semibold mb-3 text-gray-800">Location Map</h3>
            <div className="h-64 rounded-lg overflow-hidden">
              <MapContainer
                center={[incident.latitude, incident.longitude]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker
                  position={[incident.latitude, incident.longitude]}
                  icon={incidentIcon}
                >
                  <Popup>{incident.location || "Incident Location"}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

