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
  Trash2,
  Camera,
  UploadCloud,
  MapPin,
  X,
  LoaderCircle,
  ShieldCheck,
  ShieldAlert,
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

// Helper function to convert a file to a base64 string
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

// Media Preview with Analysis Status
const MediaPreview = ({ file, onRemove, analysisStatus }) => {
  const fileType = file.type.split("/")[0];
  return (
    <div className="relative w-24 h-24 rounded-lg overflow-hidden group border border-gray-200">
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
      {analysisStatus !== "idle" && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
          {analysisStatus === "analyzing" && (
            <LoaderCircle className="animate-spin" />
          )}
          {analysisStatus === "verified" && (
            <ShieldCheck className="text-green-400" />
          )}
          {analysisStatus === "invalid" && (
            <ShieldAlert className="text-red-400" />
          )}
        </div>
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

// File Uploader
const FileUploader = ({ files, setFiles, maxFiles, mode, onFilesSelected, analysisStatus }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    if (files.length + newFiles.length <= maxFiles) {
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      onFilesSelected(newFiles);
    } else {
      alert(`You can only upload a maximum of ${maxFiles} file(s).`);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    if (files.length - 1 === 0) {
      onFilesSelected([]);
    }
  };

  return (
    <div className="w-full p-6 bg-white rounded-2xl mt-6 border border-gray-200 shadow-sm">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-40 border-2 border-dashed border-emerald-300 rounded-xl flex flex-col items-center justify-center text-emerald-600 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300"
      >
        <UploadCloud size={40} className="mb-2" />
        <p className="font-semibold">Tap to upload media</p>
        <p className="text-xs text-emerald-500">
          {mode === "report" ? "1 Photo or Video" : "Up to 2 Photos or Videos"}
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
          <h3 className="font-semibold text-gray-700 mb-2">
            {mode === "report" ? "Verification Status:" : "Selected Files:"}
          </h3>
          <div className="flex flex-wrap gap-4">
            {files.map((file, index) => (
              <MediaPreview
                key={index}
                file={file}
                onRemove={() => handleRemoveFile(index)}
                analysisStatus={mode === "report" ? analysisStatus : "idle"}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Map Component for Leaflet Fallback
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
      center={[10.5276, 76.2144]} // Thrissur, Kerala
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

export default function UploadPage() {
  const [mode, setMode] = useState("report");
  const [reportFiles, setReportFiles] = useState([]);
  const [cleanupFiles, setCleanupFiles] = useState([]);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle, analyzing, verified, invalid
  const [analysisError, setAnalysisError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "Low",
  });
  const [errors, setErrors] = useState({});
  const [imageUrl, setImageUrl] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelection = async (selectedFiles) => {
    if (mode !== "report") {
      setAnalysisStatus("idle");
      setAnalysisError("");
      return;
    }

    const files = mode === "report" ? reportFiles : cleanupFiles;
    if (files.length + selectedFiles.length > (mode === "report" ? 1 : 2)) {
      alert(`You can only upload a maximum of ${mode === "report" ? 1 : 2} file(s).`);
      return;
    }

    setAnalysisStatus("analyzing");
    setAnalysisError("");

    try {
      const firstFile = selectedFiles[0];
      const base64Data = await fileToBase64(firstFile);

      const prompt =
        "Is this an image of trash, waste, litter, or garbage? Answer with a simple JSON object: {\"is_trash\": boolean}.";

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: firstFile.type, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              is_trash: { type: "BOOLEAN" },
            },
          },
        },
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCjbRIxZPp_tpBnS-v9glJFCYoyL-CGbzs";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API request failed: ${errorBody.error.message}`);
      }

      const result = await response.json();

      if (
        !result.candidates ||
        result.candidates.length === 0 ||
        !result.candidates[0].content ||
        !result.candidates[0].content.parts
      ) {
        if (result.candidates && result.candidates[0].finishReason === "SAFETY") {
          throw new Error("Image was blocked for safety reasons.");
        }
        throw new Error("API returned an empty or invalid response.");
      }

      const jsonText = result.candidates[0].content.parts[0].text;
      const parsedResult = JSON.parse(jsonText);

      if (parsedResult.is_trash) {
        setAnalysisStatus("verified");
      } else {
        setAnalysisStatus("invalid");
        setAnalysisError("This doesn't look like trash. Please upload a different photo.");
        setTimeout(() => {
          setReportFiles([]);
          setAnalysisStatus("idle");
          setAnalysisError("");
        }, 3000);
      }
    } catch (error) {
      console.error("Gemini verification error:", error);
      setAnalysisStatus("invalid");
      setAnalysisError(`Verification failed: ${error.message}`);
      setTimeout(() => {
        setReportFiles([]);
        setAnalysisStatus("idle");
        setAnalysisError("");
      }, 3000);
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Please enter a title.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description.";
    }
    if (mode === "report" && !formData.severity) {
      newErrors.severity = "Please select a severity.";
    }
    const files = mode === "report" ? reportFiles : cleanupFiles;
    if (files.length === 0) {
      newErrors.media = "Please upload at least one file.";
    }
    if (mode === "report" && analysisStatus !== "verified") {
      newErrors.media = "Please upload a verified trash image.";
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

    const files = mode === "report" ? reportFiles : cleanupFiles;
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("type", mode);
    if (location) {
      data.append("latitude", location.lat);
      data.append("longitude", location.lon);
      data.append(
        "location",
        locationName || `${location.lat}, ${location.lon}`
      );
    }
    if (mode === "report") {
      data.append("severity", formData.severity);
    }
    files.forEach((file) => data.append("media", file));

    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token); // Debug token
      if (!token) {
        setErrors({ server: "Please log in to submit a report." });
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImageUrl(response.data.report.mediaUrls[0]);
      alert("Report submitted successfully!");
      setFormData({ title: "", description: "", severity: "Low" });
      setReportFiles([]);
      setCleanupFiles([]);
      setLocation(null);
      setLocationName("");
      setShowMap(false);
      setAnalysisStatus("idle");
      setAnalysisError("");
    } catch (err) {
      console.error("Submission error:", err); // Debug error
      setErrors({
        server:
          err.response?.data?.message ||
          err.response?.data?.errors?.map((e) => e.msg).join(", ") ||
          "Report submission failed. Please check your network and try again.",
      });
    }
  };

  useEffect(() => {
    setReportFiles([]);
    setCleanupFiles([]);
    setFormData({ title: "", description: "", severity: "Low" });
    setErrors({});
    setImageUrl(null);
    setShowMap(false);
    setLocation(null);
    setLocationName("");
    setAnalysisStatus("idle");
    setAnalysisError("");
  }, [mode]);

  return (
    <div className="bg-emerald-50 min-h-screen text-gray-800 font-sans flex flex-col items-center p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-emerald-700">
          Make a Report
        </h1>
        <p className="text-emerald-600 text-center mb-8">
          Choose your report type and upload media.
        </p>

        <div className="flex w-full bg-emerald-100 rounded-full p-1.5 shadow-inner">
          <button
            onClick={() => setMode("report")}
            className={`w-1/2 py-3 rounded-full text-center font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              mode === "report"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400"
                : "text-emerald-600 hover:bg-emerald-200"
            }`}
          >
            <Trash2 size={20} />
            <span>Report Waste</span>
          </button>
          <button
            onClick={() => setMode("cleanup")}
            className={`w-1/2 py-3 rounded-full text-center font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              mode === "cleanup"
                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400"
                : "text-emerald-600 hover:bg-emerald-200"
            }`}
          >
            <Camera size={20} />
            <span>Report Cleanup</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="Report Title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Describe the issue"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {mode === "report" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Severity
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.severity && (
                <p className="text-sm text-red-500 mt-1">{errors.severity}</p>
              )}
            </div>
          )}

          <div>
            {mode === "report" ? (
              <FileUploader
                files={reportFiles}
                setFiles={setReportFiles}
                maxFiles={1}
                mode="report"
                onFilesSelected={handleFileSelection}
                analysisStatus={analysisStatus}
              />
            ) : (
              <FileUploader
                files={cleanupFiles}
                setFiles={setCleanupFiles}
                maxFiles={2}
                mode="cleanup"
                onFilesSelected={handleFileSelection}
                analysisStatus={analysisStatus}
              />
            )}
            {errors.media && (
              <p className="text-sm text-red-500 mt-1">{errors.media}</p>
            )}
            {mode === "report" && analysisError && (
              <p className="text-sm text-red-500 mt-1">{analysisError}</p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleTrackLocation}
              disabled={isTracking}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-bold py-4 rounded-full hover:bg-emerald-700 transition-all duration-300 shadow-lg disabled:bg-gray-400"
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
              <div className="mt-4 text-center bg-emerald-100 p-3 rounded-lg text-emerald-700 text-sm font-medium">
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
                  Select Location on Map (Thrissur, Kerala)
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

          {imageUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Uploaded Media:
              </p>
              {imageUrl.includes(".mp4") || imageUrl.includes(".webm") ? (
                <video
                  src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
                  controls
                  className="mt-2 w-full h-auto rounded-md"
                />
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
                  alt="Uploaded report"
                  className="mt-2 w-full h-auto rounded-md"
                />
              )}
            </div>
          )}

          {errors.server && (
            <p className="text-sm text-red-500 mt-1">{errors.server}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-full text-sm font-bold transition shadow-lg"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}