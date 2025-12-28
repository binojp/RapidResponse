const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Route Imports
const authRoutes = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const userProfileRoutes = require("./routes/User");

dotenv.config();
const app = express();

// 1. ABSOLUTE FIRST: Manual CORS & Preflight Interceptor
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://rapidresponse-ege.pages.dev",
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle Preflight: Respond with 200 OK immediately for OPTIONS
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 2. Standard Middleware
app.use(express.json());

// 3. Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. API Routes
app.use("/api", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/user", userProfileRoutes);

// 5. MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
