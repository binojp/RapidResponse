const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const userRouter = require("./routes/User");

dotenv.config();

const app = express();

app.use(express.json());

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://rapidresponse-ege.pages.dev",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Preflight OPTIONS handler
app.options("*", cors());

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/user", userRouter);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);