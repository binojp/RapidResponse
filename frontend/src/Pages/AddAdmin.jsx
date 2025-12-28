import React, { useState } from "react";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

function AddAdmin() {
  const [formData, setFormData] = useState({
    name: "",
      email: "",
    password: "",
    role: "admin",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/add`,
        formData
      );
      setSuccess("Admin added successfully!");
      setFormData({ name: "", email: "", password: "", role: "admin" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add admin.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-800">Add New Responder</h2>
        </div>
        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              readOnly
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-blue-600 text-white py-2 rounded-md text-sm font-medium hover:from-red-700 hover:to-blue-700 transition-colors"
          >
            Add Admin
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddAdmin;
