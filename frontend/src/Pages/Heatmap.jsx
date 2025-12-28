import React, { useState, useEffect, Component, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCcw,
  Map as MapIcon,
  List,
  Navigation,
  X,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Leaflet Icon Fixes ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// --- Map Controller: Fixes Rendering & Handles Navigation ---
const MapController = ({ targetLocation, showList }) => {
  const map = useMap();

  // Fix rendering issues when the container size changes
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [showList, map]);

  // Handle "Go to Location"
  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 16, { animate: true, duration: 1.5 });
    }
  }, [targetLocation, map]);

  return null;
};

const HeatMap = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showList, setShowList] = useState(false);
  const [targetLoc, setTargetLoc] = useState(null);

  const navigate = useNavigate();
  const mapCenter = [10.5276, 76.2144];
  const API_BASE = import.meta.env.VITE_API_URL;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const { data } = await axios.get(`${API_BASE}/api/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(
        data.filter((inc) => inc.latitude && inc.longitude && !inc.duplicateOf)
      );
      setError("");
    } catch (err) {
      setError("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-slate-100 overflow-hidden font-sans border-t border-slate-200">
      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 h-[calc(100vh-64px)] z-[2002] bg-white shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-200 flex flex-col w-[85%] sm:w-80 
        ${showList ? "translate-x-0" : "-translate-x-full"}`}
        style={{ top: "64px" }}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <List size={16} className="text-red-600" />
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-widest">
              Active Incidents
            </h2>
          </div>
          <button
            onClick={() => setShowList(false)}
            className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar pb-10">
          {reports.map((inc) => (
            <div
              key={inc._id}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-red-400 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                    inc.severity === "High"
                      ? "bg-red-50 text-red-600 border-red-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}
                >
                  {inc.severity}
                </span>
                <button
                  onClick={() => navigate(`/responder/incident/${inc._id}`)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Eye size={18} />
                </button>
              </div>
              <h3 className="text-[13px] font-bold text-slate-800 leading-tight mb-3 truncate">
                {inc.title}
              </h3>
              <button
                onClick={() => {
                  setTargetLoc([inc.latitude, inc.longitude]);
                  if (window.innerWidth < 768) setShowList(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-[10px] font-black uppercase hover:bg-red-600 transition-all shadow-sm"
              >
                <Navigation size={12} /> Focus Map
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Map Content */}
      <div className="relative w-full h-full z-0">
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between items-start">
          {!showList && (
            <button
              onClick={() => setShowList(true)}
              className="pointer-events-auto bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 hover:bg-red-600 transition-all"
            >
              <List size={18} />
              <span className="text-[11px] font-black uppercase tracking-wider">
                Show Reports
              </span>
            </button>
          )}
          <div className="flex-1" /> {/* Spacer */}
          <button
            onClick={fetchReports}
            className="pointer-events-auto bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 text-slate-700 hover:text-red-600 transition-all"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
          style={{ height: "100%", width: "100%" }} // Critical for rendering
        >
          <MapController targetLocation={targetLoc} showList={showList} />
          <ZoomControl position="bottomright" />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {reports.map((incident) => (
            <Marker
              key={incident._id}
              position={[incident.latitude, incident.longitude]}
              icon={
                incident.severity === "High" ? redIcon : new L.Icon.Default()
              }
            >
              <Popup
                maxWidth={260}
                minWidth={220}
                className="rounded-xl overflow-hidden"
              >
                <div className="flex flex-col gap-2 p-0.5">
                  <h3 className="text-xs font-black text-slate-800 uppercase truncate m-0">
                    {incident.title}
                  </h3>
                  {incident.mediaUrls?.length > 0 && (
                    <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-100 bg-slate-900">
                      <img
                        className="w-full h-full object-cover"
                        src={`${API_BASE}${incident.mediaUrls[0]}`}
                        alt=""
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-slate-50 p-1 rounded text-center border border-slate-100">
                      <span className="text-[7px] font-black text-slate-400 uppercase block leading-none mb-1">
                        Status
                      </span>
                      <span className="text-[9px] font-bold text-slate-700 uppercase">
                        {incident.status}
                      </span>
                    </div>
                    <div
                      className={`p-1 rounded text-center border ${
                        incident.severity === "High"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-slate-50"
                      }`}
                    >
                      <span className="text-[7px] font-black text-slate-400 uppercase block leading-none mb-1">
                        Priority
                      </span>
                      <span className="text-[9px] font-bold uppercase">
                        {incident.severity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      navigate(`/responder/incident/${incident._id}`)
                    }
                    className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest mt-1"
                  >
                    Full Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default HeatMap;
