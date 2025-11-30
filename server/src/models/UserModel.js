const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true },

    // Saved Jobs/Internships
    savedOpportunities: [
      {
        itemId: mongoose.Schema.Types.ObjectId,
        itemType: { type: String, enum: ["Job", "Internship"] },
        savedAt: { type: Date, default: Date.now },
      },
    ],

    summary: { type: String },

    // Role & Job Preferences
    role: {
      type: String,
      enum: ["job-seeker", "recruiter", "admin"],
      default: "job-seeker",
      index: true,
    },
    desiredDomain: { type: String, default: "" },
    desiredRole: { type: String },

    // Skills
    skills: { type: [String], default: [], index: true },
    verifiedSkills: { type: [String], default: [] },

    // Test Data
    test: { type: [Object], default: [] },

    // Session Handling
    sessionToken: { type: String, default: null, index: true },

    // Activity Tracking
    lastLogin: Date,
    lastLogout: Date,
    lastActive: Date,
    lastActiveDisplay: String,

    onlineStatus: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
      index: true,
    },
    profilePath: String,
    resumePath: String,
  },
  { timestamps: true }
);

// ------------------------------------------------------
// 🔍 INDEXES
// ------------------------------------------------------
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, desiredDomain: 1 });
userSchema.index({ sessionToken: 1 });
userSchema.index({ skills: 1 });

// ❌ FIX: removed invalid applications index
// userSchema.index({ applications: 1 });

// ------------------------------------------------------
// 🔐 METHODS
// ------------------------------------------------------
userSchema.methods.generateSessionToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// ⚡ updated version – no heavy .save()
userSchema.methods.updateLastLogin = async function () {
  const now = new Date();

  // write only changed fields
  await mongoose
    .model("User")
    .updateOne({ _id: this._id }, { $set: { lastLogin: now } });

  return this;
};

userSchema.methods.updateActivity = async function () {
  const now = new Date();
  const formatted = format12HourWithDate(now);

  await mongoose.model("User").updateOne(
    { _id: this._id },
    {
      $set: {
        lastActive: now,
        lastActiveDisplay: formatted,
        onlineStatus: "online",
      },
    }
  );

  return this;
};

userSchema.methods.markOffline = async function () {
  const now = new Date();
  const formatted = format12HourWithDate(now);

  await mongoose.model("User").updateOne(
    { _id: this._id },
    {
      $set: {
        lastLogout: now,
        lastActiveDisplay: formatted,
        onlineStatus: "offline",
      },
    }
  );

  return this;
};

function format12HourWithDate(date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

module.exports = mongoose.model("User", userSchema);
