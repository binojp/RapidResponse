const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  city: { type: String },
  totalPoints: { type: Number, default: 0 }, 
  pointsRemaining: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  redeemedRewards: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      points: { type: Number, required: true },
      redeemedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
