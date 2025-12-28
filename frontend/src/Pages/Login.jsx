import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const fillDemo = (email, password) => {
    setFormData({ email, password });
    setErrors({}); // clear any previous errors
  };

  const validate = () => {
    let newErrors = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Please enter your password.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Sending login request with:", formData); // Debug payload
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Login response:", response.data); // Debug response
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Dispatch custom event to notify navbar of login
      window.dispatchEvent(new Event("storage"));

      if (["admin", "superadmin"].includes(user.role)) {
        navigate("/responder/dashboard");
      } else {
        navigate("/citizen/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data); // Debug error
      setErrors({
        server:
          err.response?.data?.message ||
          "Login failed. Invalid email or password.",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-blue-50 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent mb-1">
          Login
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email below to login to your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {errors.server && (
            <p className="text-sm text-red-500 mt-1">{errors.server}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-2 rounded-md text-sm font-medium transition"
          >
            Sign In
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-red-600 hover:underline">
              Sign up
            </a>
          </p>
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Demo Accounts (for testing) - Just Tap the Acount You Want to
              Login
            </p>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => fillDemo("arun@app.com", "123456")}
                className="w-full border border-gray-300 text-sm py-2 rounded-md hover:bg-gray-100"
              >
                Citizen Demo – arun@app.com
              </button>

              <button
                type="button"
                onClick={() => fillDemo("alex@app.com", "123456")}
                className="w-full border border-gray-300 text-sm py-2 rounded-md hover:bg-gray-100"
              >
                Citizen Demo – alex@app.com
              </button>

              <button
                type="button"
                onClick={() => fillDemo("admin@app.com", "123456")}
                className="w-full border border-red-300 text-sm py-2 rounded-md hover:bg-red-50"
              >
                Responder Demo – admin@app.com
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
