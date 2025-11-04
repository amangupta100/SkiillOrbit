const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true },

    // Profile info
    summary: { type: String },
    certification: { type: [Object], default: [] },
    education: { type: [Object], default: [] },
    experience: { type: [Object], default: [] },
    achievements: { type: [Object], default: [] },
    projects: { type: [Object], default: [] },

    // Media
    image: {
      type: {
        data: String, // Base64 encoded
        contentType: String,
        lastModified: Date,
      },
      default: null,
    },
    resume: {
      data: Buffer,
      contentType: String,
      lastModified: { type: Date, default: Date.now },
      filename: String,
    },

    // Role & job preferences
    role: {
      type: String,
      enum: ["job-seeker", "recruiter", "admin"],
      default: "job-seeker",
    },
    desiredDomain: { type: String, default: "" },
    desiredRole: { type: String },

    // Skill Data
    skills: { type: [String], default: [] },
    verifiedSkills: { type: [String], default: [] },

    // Test Data
    test: { type: [Object], default: [] },
    testScores: { type: Number, default: null },
    scoreExpiry: { type: Date, default: null },

    // ✅ Application references
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application", // References applications for jobs or internships
      },
    ],

    // Session management
    sessionToken: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    loginHistory: [{ timestamp: { type: Date, default: Date.now } }],
    lastLogout: { type: Date, default: null },
    lastActive: { type: Date, default: null },
    lastActiveDisplay: { type: String, default: null },

    onlineStatus: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
  },
  { timestamps: true }
);

//
// 🔍 INDEXES
//
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ skills: 1 });
userSchema.index({ role: 1, desiredDomain: 1 });
userSchema.index({ applications: 1 });

//
// 🔑 METHODS
//
userSchema.methods.generateSessionToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  this.loginHistory.push({ timestamp: this.lastLogin });
  if (this.loginHistory.length > 10)
    this.loginHistory = this.loginHistory.slice(-10);
  await this.save();
  return this;
};

userSchema.methods.updateActivity = async function () {
  const now = new Date();
  this.lastActive = now;
  this.lastActiveDisplay = format12HourWithDate(now);
  this.onlineStatus = "online";
  await this.save();
  return this;
};

userSchema.methods.markOffline = async function () {
  const now = new Date();
  this.onlineStatus = "offline";
  this.lastActiveDisplay = format12HourWithDate(now);
  await this.save();
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

userSchema.pre("save", function (next) {
  if (this.isModified("lastActive") && this.lastActive) {
    this.lastActiveDisplay = format12HourWithDate(this.lastActive);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
