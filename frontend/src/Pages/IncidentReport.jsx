import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import {
  AlertTriangle,
  UploadCloud,
  MapPin,
  X,
  LoaderCircle,
  Camera,
  Video,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Media Preview Component
const MediaPreview = ({ file, onRemove }) => {
  const fileType = file.type.split("/")[0];
  return (
    <div className="relative w-24 h-24 rounded-lg overflow-hidden group border border-red-200">
      {fileType === "image" ? (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={URL.createObjectURL(file)}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
        <button
          onClick={onRemove}
          className="p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// File Uploader Component
const FileUploader = ({ files, setFiles, maxFiles }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    if (files.length + newFiles.length <= maxFiles) {
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    } else {
      alert(`You can only upload a maximum of ${maxFiles} file(s).`);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  return (
    <div className="w-full p-6 bg-white rounded-2xl mt-6 border border-red-200 shadow-sm">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-40 border-2 border-dashed border-red-300 rounded-xl flex flex-col items-center justify-center text-red-600 cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all duration-300"
      >
        <UploadCloud size={40} className="mb-2" />
        <p className="font-semibold">Tap to upload media</p>
        <p className="text-xs text-red-500">
          Up to {maxFiles} Photos or Videos
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
        capture="environment"
      />
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Selected Files:</h3>
          <div className="flex flex-wrap gap-4">
            {files.map((file, index) => (
              <MediaPreview
                key={index}
                file={file}
                onRemove={() => handleRemoveFile(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Map Component for Location Selection
const LocationPicker = ({ setLocation, setLocationName, setLocationError }) => {
  const [position, setPosition] = useState(null);

  const MapClickHandler = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setLocation({ lat, lon: lng });
        setLocationError("");
        map.setView([lat, lng], 13);
        axios
          .get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          )
          .then((response) => {
            const address = response.data.display_name || "Unknown location";
            setLocationName(address);
          })
          .catch(() => setLocationName("Unable to fetch location name"));
      },
    });
    return position ? (
      <Marker position={position}>
        <Popup>
          Selected Location: {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </Popup>
      </Marker>
    ) : null;
  };

  return (
    <MapContainer
      center={[10.5276, 76.2144]} // Default location
      zoom={13}
      style={{ height: "200px", width: "100%", borderRadius: "8px", zIndex: 1 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler />
    </MapContainer>
  );
};

export default function IncidentReport() {
  const [files, setFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "accident",
    severity: "Medium",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const incidentTypes = [
    { value: "accident", label: "Accident" },
    { value: "medical", label: "Medical Emergency" },
    { value: "fire", label: "Fire" },
    { value: "infrastructure", label: "Infrastructure Failure" },
    { value: "crime", label: "Crime" },
    { value: "natural_disaster", label: "Natural Disaster" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Please enter a title.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description.";
    }
    if (!formData.type) {
      newErrors.type = "Please select an incident type.";
    }
    if (!formData.severity) {
      newErrors.severity = "Please select a severity level.";
    }
    if (!location) {
      newErrors.location = "Please provide a location.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTrackLocation = () => {
    setIsTracking(true);
    setLocationError("");
    setLocation(null);
    setLocationName("");
    setShowMap(false);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsTracking(false);
      setShowMap(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        setIsTracking(false);
        axios
          .get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          )
          .then((response) => {
            const address = response.data.display_name || "Unknown location";
            setLocationName(address);
          })
          .catch(() => setLocationName("Unable to fetch location name"));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location access denied. Please allow location permissions or select on map."
          );
          setShowMap(true);
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Location unavailable. Please select on map.");
          setShowMap(true);
        } else {
          setLocationError(`Error getting location: ${error.message}`);
          setShowMap(true);
        }
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("type", formData.type);
    data.append("severity", formData.severity);
    data.append("latitude", location.lat);
    data.append("longitude", location.lon);
    data.append("location", locationName || `${location.lat}, ${location.lon}`);
    
    files.forEach((file) => data.append("media", file));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrors({ server: "Please log in to report an incident." });
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/incidents`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(`Incident reported successfully! Incident ID: ${response.data.incident.incidentId}`);
      setFormData({ title: "", description: "", type: "accident", severity: "Medium" });
      setFiles([]);
      setLocation(null);
      setLocationName("");
      setShowMap(false);
      navigate("/citizen/dashboard");
    } catch (err) {
      console.error("Submission error:", err);
      setErrors({
        server:
          err.response?.data?.message ||
          "Incident submission failed. Please check your network and try again.",
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-50 min-h-screen text-gray-800 font-sans flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-red-700">
          Report Emergency Incident
        </h1>
        <p className="text-red-600 text-center mb-8">
          Report incidents instantly to help responders act quickly.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Incident Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {incidentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-red-500 mt-1">{errors.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="Brief description of the incident"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              name="description"
              placeholder="Provide detailed information about the incident"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Severity *
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {errors.severity && (
              <p className="text-sm text-red-500 mt-1">{errors.severity}</p>
            )}
          </div>

          <div>
            <FileUploader files={files} setFiles={setFiles} maxFiles={5} />
            {errors.media && (
              <p className="text-sm text-red-500 mt-1">{errors.media}</p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleTrackLocation}
              disabled={isTracking}
              className="w-full flex items-center justify-center gap-3 bg-red-600 text-white font-bold py-4 rounded-full hover:bg-red-700 transition-all duration-300 shadow-lg disabled:bg-gray-400"
            >
              {isTracking ? (
                <>
                  <LoaderCircle size={24} className="animate-spin" />
                  <span>Acquiring Location...</span>
                </>
              ) : (
                <>
                  <MapPin size={24} />
                  <span>Track Live Location</span>
                </>
              )}
            </button>
            {location && (
              <div className="mt-4 text-center bg-red-100 p-3 rounded-lg text-red-700 text-sm font-medium">
                Location:{" "}
                {locationName ||
                  `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
              </div>
            )}
            {locationError && (
              <div className="mt-4 text-center bg-red-100 p-3 rounded-lg text-red-700 text-sm font-medium">
                {locationError}
              </div>
            )}
            {showMap && (
              <div className="mt-4 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location on Map
                </label>
                <LocationPicker
                  setLocation={setLocation}
                  setLocationName={setLocationName}
                  setLocationError={setLocationError}
                />
              </div>
            )}
            {errors.location && (
              <p className="text-sm text-red-500 mt-1">{errors.location}</p>
            )}
          </div>

          {errors.server && (
            <p className="text-sm text-red-500 mt-1">{errors.server}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-4 rounded-full text-sm font-bold transition shadow-lg"
          >
            Submit Incident Report
          </button>
        </form>
      </div>
    </div>
  );
}

