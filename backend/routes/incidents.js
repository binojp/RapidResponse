const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Incident = require("../models/Incident");
const router = express.Router();

// Configuration: Number of upvotes required for auto-verification
const UPVOTE_VERIFICATION_THRESHOLD = 1;

// Ensure Uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4|webm/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images and MP4/WebM videos are allowed"));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or invalid format" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

// Middleware to check role
const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Helper function to check for duplicate incidents (within 100m and 5 minutes)
const findDuplicateIncidents = async (
  latitude,
  longitude,
  type,
  timeWindow = 5 * 60 * 1000
) => {
  const timeThreshold = new Date(Date.now() - timeWindow);

  // Find incidents within ~100 meters (approximately 0.001 degrees)
  const nearbyIncidents = await Incident.find({
    type,
    latitude: { $gte: latitude - 0.001, $lte: latitude + 0.001 },
    longitude: { $gte: longitude - 0.001, $lte: longitude + 0.001 },
    createdAt: { $gte: timeThreshold },
    duplicateOf: null, // Only check non-duplicate incidents
  });

  return nearbyIncidents;
};

// Create Incident
router.post("/", authMiddleware, upload.array("media", 5), async (req, res) => {
  const { title, description, type, latitude, longitude, location, severity } =
    req.body;

  // Validate input
  if (!title || !description || !type || !latitude || !longitude) {
    return res.status(400).json({
      message: "Title, description, type, latitude, and longitude are required",
    });
  }

  const validTypes = [
    "accident",
    "medical",
    "fire",
    "infrastructure",
    "crime",
    "natural_disaster",
    "other",
  ];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid incident type" });
  }

  if (!["Low", "Medium", "High"].includes(severity)) {
    return res.status(400).json({ message: "Invalid severity level" });
  }

  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Check for duplicates
    const duplicates = await findDuplicateIncidents(lat, lon, type);

    let incident;
    if (duplicates.length > 0) {
      // Mark as duplicate of the first incident
      const primaryIncident = duplicates[0];
      const mediaUrls = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];

      incident = new Incident({
        title,
        description,
        type,
        latitude: lat,
        longitude: lon,
        location: location || "Location not provided",
        mediaUrls,
        user: req.user.id,
        status: "Reported",
        severity,
        duplicateOf: primaryIncident._id,
        isVerified: false,
      });

      // Add to merged incidents of primary
      primaryIncident.mergedIncidents.push(incident._id);
      await primaryIncident.save();
    } else {
      // New incident
      const mediaUrls = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];
      incident = new Incident({
        title,
        description,
        type,
        latitude: lat,
        longitude: lon,
        location: location || "Location not provided",
        mediaUrls,
        user: req.user.id,
        status: "Reported",
        severity,
        isVerified: false,
      });
    }

    await incident.save();
    await incident.populate("user", "name email _id");

    res.status(201).json({
      message: "Incident reported successfully",
      incident: {
        _id: incident._id,
        incidentId: incident.incidentId,
        title: incident.title,
        description: incident.description,
        type: incident.type,
        latitude: incident.latitude,
        longitude: incident.longitude,
        location: incident.location,
        mediaUrls: incident.mediaUrls,
        user: incident.user,
        status: incident.status,
        severity: incident.severity,
        isVerified: incident.isVerified,
        duplicateOf: incident.duplicateOf,
        createdAt: incident.createdAt,
      },
    });
  } catch (err) {
    console.error("Error creating incident:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get All Incidents (Live Feed)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, type, verified, latitude, longitude, radius } = req.query;
    let query = { duplicateOf: null }; // Only show non-duplicate incidents

    if (
      status &&
      ["Reported", "Verified", "In Progress", "Resolved", "Rejected"].includes(
        status
      )
    ) {
      query.status = status;
    }

    if (
      type &&
      [
        "accident",
        "medical",
        "fire",
        "infrastructure",
        "crime",
        "natural_disaster",
        "other",
      ].includes(type)
    ) {
      query.type = type;
    }

    if (verified === "true") {
      query.isVerified = true;
    } else if (verified === "false") {
      query.isVerified = false;
    }

    // Filter by distance if latitude, longitude, and radius are provided
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const rad = parseFloat(radius); // in kilometers
      const latRange = rad / 111; // approximately 111 km per degree
      const lonRange = rad / (111 * Math.cos((lat * Math.PI) / 180));

      query.latitude = { $gte: lat - latRange, $lte: lat + latRange };
      query.longitude = { $gte: lon - lonRange, $lte: lon + lonRange };
    }

    const incidents = await Incident.find(query)
      .populate("user", "name email _id")
      .populate("verifiedBy", "name email _id")
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (err) {
    console.error("Error fetching incidents:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Single Incident
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("user", "name email _id")
      .populate("verifiedBy", "name email _id")
      .populate("internalNotes.addedBy", "name email _id");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Hide internal notes from non-responders
    const response = incident.toObject();
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      response.internalNotes = [];
    }

    res.json(response);
  } catch (err) {
    console.error("Error fetching incident:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Upvote Incident (for verification)
router.post("/:id/upvote", authMiddleware, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const userId = req.user.id;

    // Prevent users from upvoting their own incidents
    if (incident.user.toString() === userId.toString()) {
      return res.status(400).json({
        message: "You cannot upvote your own incident",
        upvotes: incident.upvotes.length,
        isVerified: incident.isVerified,
        hasUpvoted: false,
      });
    }

    const hasUpvoted =
      incident.upvotes.some(
        (upvoteId) => upvoteId.toString() === userId.toString()
      ) || incident.upvotes.includes(userId);

    if (hasUpvoted) {
      // Remove upvote
      incident.upvotes = incident.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Add upvote
      incident.upvotes.push(userId);
    }

    // Auto-verify if threshold or more upvotes
    if (
      incident.upvotes.length >= UPVOTE_VERIFICATION_THRESHOLD &&
      !incident.isVerified
    ) {
      incident.isVerified = true;
      incident.verificationMethod = "upvote";
      incident.verifiedAt = new Date();
    } else if (
      incident.upvotes.length < UPVOTE_VERIFICATION_THRESHOLD &&
      incident.verificationMethod === "upvote"
    ) {
      // Unverify if upvotes drop below threshold
      incident.isVerified = false;
      incident.verificationMethod = null;
      incident.verifiedAt = null;
    }

    await incident.save();
    res.json({
      upvotes: incident.upvotes.length,
      isVerified: incident.isVerified,
      hasUpvoted: !hasUpvoted,
    });
  } catch (err) {
    console.error("Error upvoting incident:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Verify Incident (Admin/Responder only)
router.post(
  "/:id/verify",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      incident.isVerified = true;
      incident.verificationMethod = "admin";
      incident.verifiedBy = req.user.id;
      incident.verifiedAt = new Date();

      await incident.save();
      res.json(incident);
    } catch (err) {
      console.error("Error verifying incident:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Update Incident Status (Responder only)
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  async (req, res) => {
    const { status } = req.body;
    if (
      !["Reported", "Verified", "In Progress", "Resolved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      incident.status = status;
      await incident.save();
      res.json(incident);
    } catch (err) {
      console.error("Error updating incident status:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Add Internal Note (Responder only)
router.post(
  "/:id/notes",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  async (req, res) => {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Note is required" });
    }
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      incident.internalNotes.push({
        note: note.trim(),
        addedBy: req.user.id,
      });
      await incident.save();
      await incident.populate("internalNotes.addedBy", "name email _id");
      res.json(incident);
    } catch (err) {
      console.error("Error adding note:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

module.exports = router;
