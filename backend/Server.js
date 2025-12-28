const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors()); // Temporary wide-open CORS for testing

// Simple Health Check
app.get("/", (req, res) => res.send("API IS ALIVE"));

// Import routes (Ensure these filenames match your folders EXACTLY)
app.use("/api", require("./routes/auth"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/user", require("./routes/User")); // Check capitalization!

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));
  })
  .catch((err) => console.error("DB Error:", err));
