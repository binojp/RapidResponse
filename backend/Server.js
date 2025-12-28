const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Route Imports
const authRoutes = require("./routes/auth");
const incidentRoutes = require("./routes/incidents");
const userProfileRoutes = require("./routes/User");

dotenv.config();
const app = express();

// 1. JSON Middleware (MUST come before routes)
app.use(express.json());

// 2. Advanced CORS Configuration
const allowedOrigins = [
  "https://rapidresponse-ege.pages.dev",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps/Postman)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      const isAllowed =
        allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL;

      if (isAllowed) {
        callback(null, true);
      } else {
        console.error(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 3. Explicitly handle Preflight (OPTIONS) requests
app.options("*", cors());

// 4. Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 5. API Routes
// If frontend hits /api/login, and authRoutes has router.post('/login'), this is correct.
app.use("/api", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/user", userProfileRoutes);

// 6. MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 7. Health Check Route (To test if server is even awake)
app.get("/health", (req, res) => res.send("Server is up and running!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📡 Expecting Frontend at: ${process.env.FRONTEND_URL || "Not Set"}`
  );
});
