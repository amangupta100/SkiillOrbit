const mongoose = require("mongoose");
const crypto = require("crypto");

const recruiterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phoneNumber: { type: String, required: true, index: true },

    linkedInProfile: {
      type: String,
      match: /^https?:\/\/(www\.)?linkedin\.com\/.+$/,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      default: "recruiter",
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    sessionToken: { type: String, default: null, index: true },

    lastLogin: { type: Date, default: null },
    lastLogout: { type: Date, default: null },
    lastActive: { type: Date, default: null },
    lastActiveDisplay: { type: String, default: null },

    onlineStatus: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
      index: true,
    },
  },
  { timestamps: true }
);

/* ======================
    ⚡ INDEXES
======================== */
recruiterSchema.index({ email: 1 }, { unique: true });
recruiterSchema.index({ sessionToken: 1 });
recruiterSchema.index({ companyId: 1, role: 1 });
recruiterSchema.index({ onlineStatus: 1 });

/* ======================
    ⚡ METHODS (FAST)
======================== */

// Generate session token
recruiterSchema.methods.generateSessionToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Update last login (NO .save())
recruiterSchema.methods.updateLastLogin = async function () {
  const now = new Date();
  await mongoose
    .model("Recruiter")
    .updateOne({ _id: this._id }, { $set: { lastLogin: now } });
  return this;
};

// Update activity (NO .save())
recruiterSchema.methods.updateActivity = async function () {
  const now = new Date();
  const formatted = format12HourWithDate(now);

  await mongoose.model("Recruiter").updateOne(
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

// Mark offline (NO .save())
recruiterSchema.methods.markOffline = async function () {
  const now = new Date();
  const formatted = format12HourWithDate(now);

  await mongoose.model("Recruiter").updateOne(
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

/* ======================
    ⚡ HELPERS
======================== */
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

module.exports = mongoose.model("Recruiter", recruiterSchema);
