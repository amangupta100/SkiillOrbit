const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    certification: { type: [Object] },
    education: { type: [Object] },
    experience: { type: [Object] },
    achievements: { type: [Object] },
    summary: { type: String },
    projects: { type: [Object], default: [] },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: {
      type: {
        data: String, // Base64 encoded string
        contentType: String, // MIME type (e.g., 'image/jpeg')
        lastModified: Date, // When the image was last updated
      },
      default: null,
    },
    resume: {
      data: Buffer,
      contentType: String,
      lastModified: { type: Date, default: Date.now },
      filename: String,
    },
    role: {
      type: String,
      enum: ["job-seeker", "recruiter", "admin"],
      default: "job-seeker",
    },
    test: { type: [Object] },
    testScores: { type: Number, default: null },
    scoreExpiry: { type: Date, default: null },
    appliedJobs: [
      {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        status: {
          type: String,
          enum: ["pending", "interviewed", "rejected", "selected"],
          default: "pending",
        },
      },
    ],
    desiredDomain: { type: String, default: "" },
    desiredRole: { type: String },
    skills: { type: [String], default: [] },
    verifiedSkills: { type: [String], default: [] },
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

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ skills: 1 });
userSchema.index({ role: 1, desiredDomain: 1 });

// Optional: index for appliedJobs subdocument if frequently queried
userSchema.index({ "appliedJobs.jobId": 1 });
userSchema.index({ "appliedJobs.status": 1 });

// Methods
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
