const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Incident = require("../models/Incident");
const router = express.Router();

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

// Register User
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res
      .status(201)
      .json({ token, user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add Admin
router.post("/admin/add", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || role !== "admin") {
    return res
      .status(400)
      .json({ message: "All fields are required and role must be admin" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: name,
      email,
      password: hashedPassword,
      role,
    });
    await user.save();
    res.status(201).json({ message: "Admin created" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add Admin (Superadmin only)
router.post(
  "/admin",
  authMiddleware,
  roleMiddleware(["superadmin"]),
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(400).json({ message: "User is already an admin" });
      }

      user.role = "admin";
      await user.save();
      res.json({
        message: "User promoted to admin",
        user: { id: user._id, email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Create Superadmin (One-time setup)
router.post("/setup-superadmin", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingSuperadmin = await User.findOne({ role: "superadmin" });
    if (existingSuperadmin) {
      return res.status(400).json({ message: "Superadmin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const superadmin = new User({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
    });
    await superadmin.save();

    res.status(201).json({ message: "Superadmin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get User Stats
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalUsers = await User.countDocuments();
    const incidents = await Incident.find({
      user: req.user.id,
      duplicateOf: null,
    });
    const totalPoints = incidents.reduce(
      (sum, incident) =>
        sum +
        (incident.severity === "High"
          ? 50
          : incident.severity === "Medium"
          ? 25
          : 10),
      0
    );
    const monthlyPoints = incidents
      .filter(
        (incident) =>
          new Date(incident.createdAt).getMonth() === new Date().getMonth()
      )
      .reduce(
        (sum, incident) =>
          sum +
          (incident.severity === "High"
            ? 50
            : incident.severity === "Medium"
            ? 25
            : 10),
        0
      );

    const rank = Math.floor(Math.random() * totalUsers) + 1;

    const stats = {
      id: user._id,
      name: user.name || "User",
      city: "Kochi",
      rank,
      totalUsers,
      totalPoints,
      monthlyPoints,
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Dashboard Stats
router.get(
  "/dashboard-stats",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = {
        incidentsToday: await Incident.countDocuments({
          createdAt: { $gte: today, $lt: tomorrow },
          duplicateOf: null,
        }),
        needReview: await Incident.countDocuments({
          status: "Reported",
          duplicateOf: null,
        }),
        resolvedToday: await Incident.countDocuments({
          status: "Resolved",
          updatedAt: { $gte: today, $lt: tomorrow },
          duplicateOf: null,
        }),
        totalActiveUsers: await User.countDocuments({ role: "user" }),
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get Top Members
router.get(
  "/top-members",
  authMiddleware,
  roleMiddleware(["admin", "user", "superadmin"]),
  async (req, res) => {
    try {
      const users = await User.find({ role: "user" }).select("name email");
      const topMembers = await Promise.all(
        users.map(async (user) => {
          const incidents = await Incident.find({
            user: user._id,
            duplicateOf: null,
          });
          const points = incidents.reduce(
            (sum, incident) =>
              sum +
              (incident.severity === "High"
                ? 50
                : incident.severity === "Medium"
                ? 25
                : 10),
            0
          );
          const incidentsThisMonth = incidents.filter(
            (incident) =>
              new Date(incident.createdAt).getMonth() === new Date().getMonth()
          ).length;
          return {
            id: user._id,
            name: user.name || user.email,
            points,
            reportsThisMonth: incidentsThisMonth,
          };
        })
      );
      const sortedMembers = topMembers
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)
        .map((member, index) => ({ ...member, rank: index + 1 }));
      res.json(sortedMembers);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Get Fine Details (Placeholder)
router.get(
  "/fines",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const fineDetails = [
        {
          id: "1",
          violationType: "Illegal Dumping",
          amount: 5000,
          description: "Dumping waste in unauthorized areas",
          issuedToday: 3,
          totalCollected: 45000,
        },
        {
          id: "2",
          violationType: "Littering",
          amount: 500,
          description: "Throwing waste on streets/public places",
          issuedToday: 12,
          totalCollected: 28500,
        },
        {
          id: "3",
          violationType: "Improper Segregation",
          amount: 1000,
          description: "Not segregating waste properly",
          issuedToday: 8,
          totalCollected: 15000,
        },
        {
          id: "4",
          violationType: "Overflowing Private Bins",
          amount: 2000,
          description: "Not maintaining private waste containers",
          issuedToday: 2,
          totalCollected: 12000,
        },
      ];
      res.json(fineDetails);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Protected Admin Dashboard Route
router.get(
  "/admin/dashboard",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  (req, res) => {
    res.json({ message: "Welcome to the Admin Dashboard" });
  }
);

module.exports = router;
