const mongoose = require("mongoose");
const crypto = require("crypto");

const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    linkedInProfile: {
      type: String,
      match: /^https?:\/\/(www\.)?linkedin\.com\/.+$/,
    },
    password: { type: String, required: true },
    role: { type: String, default: "recruiter" },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    jobPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    lastLogin: { type: Date, default: null },
    image: {
      type: {
        data: String, // Base64 encoded string
        contentType: String, // MIME type (e.g., 'image/jpeg')
        lastModified: Date, // When the image was last updated
      },
      default: null,
    },
    sessionToken: { type: String, default: null },
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
recruiterSchema.index({ email: 1 }, { unique: true });
recruiterSchema.index({ phoneNumber: 1 });
recruiterSchema.index({ companyId: 1, role: 1 }); // compound index

// Methods
recruiterSchema.methods.generateSessionToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

recruiterSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  this.loginHistory.push({ timestamp: this.lastLogin });
  if (this.loginHistory.length > 10)
    this.loginHistory = this.loginHistory.slice(-10);
  await this.save();
  return this;
};

recruiterSchema.methods.updateActivity = async function () {
  const now = new Date();
  this.lastActive = now;
  this.lastActiveDisplay = format12HourWithDate(now);
  this.onlineStatus = "online";
  await this.save();
  return this;
};

recruiterSchema.methods.markOffline = async function () {
  const now = new Date();
  this.onlineStatus = "offline";
  this.lastActiveDisplay = format12HourWithDate(now);
  await this.save();
  return this;
};

// Helper
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

// Pre-save hook
recruiterSchema.pre("save", function (next) {
  if (this.isModified("lastActive") && this.lastActive) {
    this.lastActiveDisplay = format12HourWithDate(this.lastActive);
  }
  next();
});

module.exports = mongoose.model("Recruiter", recruiterSchema);
