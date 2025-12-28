const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Incident = require("../models/Incident");
const jwt = require("jsonwebtoken");

// Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET user profile data
// Access via: GET /api/user/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const incidents = await Incident.find({
      user: req.user.id,
      duplicateOf: null,
    });

    // Logic for points
    const totalPoints = incidents.reduce(
      (sum, inc) =>
        sum +
        (inc.severity === "High" ? 50 : inc.severity === "Medium" ? 30 : 25),
      0
    );

    // Rank logic...
    const allUsers = await User.find().select("totalPoints");
    const sortedUsers = allUsers
      .map((u) => ({ id: u._id.toString(), points: u.totalPoints || 0 }))
      .sort((a, b) => b.points - a.points);
    const rank =
      sortedUsers.findIndex((u) => u.id === req.user.id.toString()) + 1;

    res.json({
      ...user._doc,
      totalPoints,
      rank,
      totalUsers: allUsers.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH user points
// Access via: PATCH /api/user/update-points
router.patch("/update-points", authMiddleware, async (req, res) => {
  try {
    const { pointsRemaining, reward } = req.body;
    const updateData = { pointsRemaining };

    if (reward) {
      updateData.$push = {
        redeemedRewards: { ...reward, redeemedAt: new Date() },
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
