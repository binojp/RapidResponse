const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Route Imports
const authRoutes = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const userProfileRoutes = require("./routes/User"); // Renamed for clarity

dotenv.config();
const app = express();

app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://rapidresponse-ege.pages.dev",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

// Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes - Ensure no trailing slashes here
app.use("/api/", authRoutes); // Changed from "/api" to be more explicit
app.use("/api/incidents", incidentRoutes);
app.use("/api/user", userProfileRoutes);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
