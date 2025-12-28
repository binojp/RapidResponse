const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Incident = require("../models/Incident");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("No token provided or invalid format");
    return res
      .status(401)
      .json({ message: "No token provided or invalid format" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      console.error("JWT decoded but no user ID found:", decoded);
      return res.status(401).json({ message: "Invalid token: No user ID" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res
      .status(401)
      .json({ message: "Invalid token", error: err.message });
  }
};

// GET user data
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      console.error("req.user is undefined after middleware");
      return res.status(401).json({ message: "Authentication failed" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      console.error(`User not found for ID: ${req.user.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    const incidents = await Incident.find({ user: req.user.id }).catch((err) => {
      console.error("Error fetching incidents:", err.message);
      throw new Error("Failed to fetch incidents");
    });

    const totalPoints = incidents.reduce(
      (sum, incident) => sum + (incident.severity === "High" ? 50 : incident.severity === "Medium" ? 30 : 25),
      0
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyPoints = incidents.reduce((sum, incident) => {
      const incidentDate = new Date(incident.createdAt);
      if (
        incidentDate.getMonth() === currentMonth &&
        incidentDate.getFullYear() === currentYear
      ) {
        return sum + (incident.severity === "High" ? 50 : incident.severity === "Medium" ? 30 : 25);
      }
      return sum;
    }, 0);

    // Update totalPoints and pointsRemaining if necessary
    const updateData = {
      totalPoints,
      monthlyPoints,
      pointsRemaining: user.pointsRemaining || totalPoints, // Initialize pointsRemaining if not set
    };

    await User.findByIdAndUpdate(req.user.id, updateData).catch((err) => {
      console.error("Error updating user points:", err.message);
      throw new Error("Failed to update user points");
    });

    const allUsers = await User.find()
      .select("totalPoints")
      .catch((err) => {
        console.error("Error fetching all users:", err.message);
        throw new Error("Failed to fetch users");
      });

    const sortedUsers = allUsers
      .map((u) => ({ id: u._id.toString(), totalPoints: u.totalPoints || 0 }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
    const rank =
      sortedUsers.findIndex((u) => u.id === req.user.id.toString()) + 1;
    const totalUsers = allUsers.length;

    res.json({
      id: user._id.toString(),
      name: user.name || "Unknown",
      email: user.email,
      city: user.city || "Unknown",
      role: user.role,
      totalPoints,
      pointsRemaining: user.pointsRemaining || totalPoints,
      monthlyPoints,
      rank,
      totalUsers,
      redeemedRewards: user.redeemedRewards || [],
    });
  } catch (err) {
    console.error("Error in /api/user:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH user to update points and add redeemed reward
router.patch("/", authMiddleware, async (req, res) => {
  try {
    const { pointsRemaining, reward } = req.body;
    if (typeof pointsRemaining !== "number" || pointsRemaining < 0) {
      return res.status(400).json({ message: "Invalid pointsRemaining value" });
    }
    if (reward && (!reward.title || !reward.description || !reward.points)) {
      return res.status(400).json({ message: "Invalid reward data" });
    }

    // Check if reward is already redeemed
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.redeemedRewards.some((r) => r.title === reward?.title)) {
      return res.status(400).json({ message: "Reward already claimed" });
    }
    if (user.pointsRemaining < reward.points) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    const updateData = { pointsRemaining };
    if (reward) {
      updateData.$push = {
        redeemedRewards: {
          title: reward.title,
          description: reward.description,
          points: reward.points,
          redeemedAt: new Date(),
        },
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: updatedUser._id.toString(),
      totalPoints: updatedUser.totalPoints,
      pointsRemaining: updatedUser.pointsRemaining,
      redeemedRewards: updatedUser.redeemedRewards,
    });
  } catch (err) {
    console.error("Error in PATCH /api/user:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
