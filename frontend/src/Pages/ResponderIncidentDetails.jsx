import React, { useEffect, useRef, useState } from "react";
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
  MessageSquare,
  User,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Leaflet marker fix */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const incidentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const API = import.meta.env.VITE_API_URL;

export default function ResponderIncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const token = localStorage.getItem("token");

  const [incident, setIncident] = useState(null);
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchIncident = async () => {
      try {
        const { data } = await axios.get(
          `${API}/api/incidents/${id}`,
          authHeader
        );
        setIncident(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load incident");
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id, token, navigate]);

  const handleVerify = async () => {
    try {
      const { data } = await axios.post(
        `${API}/api/incidents/${id}/verify`,
        {},
        authHeader
      );
      setIncident(data);
    } catch {
      setError("Verification failed");
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const { data } = await axios.put(
        `${API}/api/incidents/${id}/status`,
        { status },
        authHeader
      );
setIncident((prev) => ({
  ...prev,
  status: data.status,
  isVerified: data.isVerified ?? prev.isVerified,
  verifiedBy: data.verifiedBy ?? prev.verifiedBy,
}));
    } catch {
      setError("Status update failed");
    }
  };

  const handleAddNote = async () => {
    if (!internalNote.trim()) return;

    try {
      const { data } = await axios.post(
        `${API}/api/incidents/${id}/notes`,
        { note: internalNote },
        authHeader
      );
      setIncident(data);
      setInternalNote("");
    } catch {
      setError("Failed to add note");
    }
  };

  const statusMeta = (status = "") => {
    const s = status.toLowerCase();
    if (s === "resolved")
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        cls: "bg-green-100 text-green-700",
      };
    if (s === "in progress")
      return {
        icon: <Clock className="w-5 h-5 text-blue-500" />,
        cls: "bg-blue-100 text-blue-700",
      };
    if (s === "verified")
      return {
        icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
        cls: "bg-blue-100 text-blue-700",
      };
    if (s === "rejected")
      return {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        cls: "bg-red-100 text-red-700",
      };

    return {
      icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      cls: "bg-yellow-100 text-yellow-700",
    };
  };

  const getVerificationInfo = () => {
    if (!incident.isVerified)
      return {
        text: "Unverified",
        icon: <ShieldAlert size={14} />,
        cls: "bg-yellow-100 text-yellow-700",
      };

    if (incident.verifiedBy)
      return {
        text: `Verified by Admin (${
          incident.verifiedBy.name || incident.verifiedBy.email || "Admin"
        })`,
        icon: <ShieldCheck size={14} />,
        cls: "bg-green-100 text-green-700",
      };

    return {
      text: `Verified by Community (${incident.upvotes?.length || 0} upvotes)`,
      icon: <ShieldCheck size={14} />,
      cls: "bg-blue-100 text-blue-700",
    };
  };

  if (loading) return <div className="py-10 text-center">Loading…</div>;
  if (error)
    return <div className="py-10 text-center text-red-600">{error}</div>;
  if (!incident)
    return (
      <div className="py-10 text-center text-gray-500">Incident not found</div>
    );

  const statusUI = statusMeta(incident.status);
  const verificationUI = getVerificationInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      <div className="sticky top-0 bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-red-600"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="font-semibold">Incident Details</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Incident Card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{incident.title}</h2>
              <p className="text-gray-600">{incident.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusUI.cls}`}
              >
                {statusUI.icon}
                {incident.status}
              </span>

              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${verificationUI.cls}`}
              >
                {verificationUI.icon}
                {verificationUI.text}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="flex-shrink-0" />
              {incident.location ||
                `${incident.latitude}, ${incident.longitude}`}
            </div>

            <div className="flex items-center gap-2">
              <User size={18} />
              {incident.user?.name || incident.user?.email || "Unknown"}
            </div>

            <div className="flex items-center gap-2">
              <Clock size={18} />
              {new Date(incident.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {!incident.isVerified && (
              <button
                onClick={handleVerify}
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                Verify Incident
              </button>
            )}

            <select
              value={incident.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            >
              <option>Reported</option>
              <option>Verified</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <MessageSquare size={18} /> Internal Notes
          </h3>

          <div className="space-y-4 max-h-64 overflow-y-auto">
            {incident.internalNotes?.length ? (
              incident.internalNotes.map((n, i) => (
                <div
                  key={i}
                  className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {typeof n.addedBy === "object"
                        ? n.addedBy.name || n.addedBy.email || "User"
                        : "User"}
                    </span>
                    <span className="text-gray-500">
                      {new Date(n.addedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{n.note}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No internal notes</p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              className="flex-1 border px-1 py-2 rounded-md"
              placeholder="Add internal note"
            />
            <button
              onClick={handleAddNote}
              className="bg-blue-600 text-white px-4 rounded-md"
            >
              Add
            </button>
          </div>
        </div>

        {/* Map */}
        {incident.latitude && incident.longitude && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3">Location</h3>
            <div className="h-64 rounded-lg overflow-hidden">
              <MapContainer
                center={[incident.latitude, incident.longitude]}
                zoom={15}
                whenReady={() => mapRef.current?.invalidateSize()}
                ref={mapRef}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker
                  position={[incident.latitude, incident.longitude]}
                  icon={incidentIcon}
                >
                  <Popup>{incident.location || "Incident location"}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
