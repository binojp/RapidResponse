import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Upload,
  ArrowLeft,
} from "lucide-react";

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyType, setReplyType] = useState("before");
  const [files, setFiles] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `https://192.168.82.139:5000/api/reports/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReport(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch report");
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, token]);

  const handleStatusUpdate = async (status) => {
    try {
      const response = await axios.put(
        `https://192.168.82.139:5000/api/reports/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      setError("Please select at least one file");
      return;
    }
    const formData = new FormData();
    formData.append("type", replyType);
    for (let i = 0; i < files.length; i++) {
      formData.append("media", files[i]);
    }
    try {
      const response = await axios.post(
        `https://192.168.82.139:5000/api/reports/${id}/reply`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setReport(response.data);
      setFiles([]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload reply");
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "reported":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700";
      case "reported":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!report)
    return (
      <div className="text-gray-500 text-center py-8">Report not found</div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow px-4 py-3 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            Report Details
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Report Info */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
              {report.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  report.status
                )}`}
              >
                {getStatusIcon(report.status)} {report.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                  report.severity
                )}`}
              >
                {report.severity}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-gray-700 text-sm sm:text-base">
              <p>
                <strong>Description:</strong> {report.description}
              </p>
              <p>
                <strong>Type:</strong> {report.type}
              </p>
              <p className="flex items-center gap-1 flex-wrap">
                <MapPin className="w-4 h-4 shrink-0" />
                <strong>Location:</strong>{" "}
                {report.location || `${report.latitude}, ${report.longitude}`}
              </p>
              <p>
                <strong>Reported By:</strong>{" "}
                {report.user
                  ? report.user.name || report.user.email || "Unknown User"
                  : "Unknown User"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Media</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {report.mediaUrls.map((url, index) => (
                  <img
                    key={index}
                    src={`https://192.168.82.139:5000${url}`}
                    alt="Report media"
                    className="w-full h-32 sm:h-40 object-cover rounded-lg shadow"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Update Status</h2>
          <div className="flex flex-wrap gap-3">
            {["Pending", "Review", "Resolved", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  report.status === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Reply Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Reply with Images</h2>
          <form
            onSubmit={handleReplySubmit}
            className="flex flex-col md:flex-row md:items-center gap-3 mb-6"
          >
            <select
              value={replyType}
              onChange={(e) => setReplyType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,video/mp4,video/webm"
              onChange={handleFileChange}
              className="text-sm"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" /> Upload
            </button>
          </form>

          <div className="space-y-6">
            {report.replies?.length ? (
              report.replies.map((reply, index) => (
                <div key={index}>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>
                      {reply.type.charAt(0).toUpperCase() + reply.type.slice(1)}{" "}
                      Image
                    </strong>{" "}
                    by{" "}
                    {reply.uploadedBy
                      ? reply.uploadedBy.name ||
                        reply.uploadedBy.email ||
                        "Unknown User"
                      : "Unknown User"}{" "}
                    on {new Date(reply.uploadedAt).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {reply.mediaUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={`https://192.168.82.139:5000${url}`}
                        alt={`${reply.type} media`}
                        className="w-32 h-32 object-cover rounded-lg shadow hover:scale-105 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No reply images uploaded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
