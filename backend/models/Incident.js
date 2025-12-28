const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "accident",
      "medical",
      "fire",
      "infrastructure",
      "crime",
      "natural_disaster",
      "other",
    ],
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  location: { type: String, default: "Location not provided" },
  mediaUrls: [{ type: String }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    default: "Reported",
    enum: ["Reported", "Verified", "In Progress", "Resolved", "Rejected"],
  },
  severity: {
    type: String,
    default: "Medium",
    enum: ["Low", "Medium", "High"],
  },
  // Verification fields
  isVerified: { type: Boolean, default: false },
  verificationMethod: {
    type: String,
    enum: ["admin", "upvote", "automatic", null],
    default: null,
  },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  // Deduplication fields
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Incident",
    default: null,
  },
  mergedIncidents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Incident" }],
  internalNotes: [
    {
      note: { type: String, required: true },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  incidentId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

incidentSchema.pre("validate", function (next) {
  if (!this.incidentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.incidentId = `INC-${timestamp}-${random}`;
  }
  next();
});

incidentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Incident", incidentSchema);
