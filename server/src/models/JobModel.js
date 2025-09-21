const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    location: {
      type: String,
      default: "Remote",
      enum: ["Remote", "Hybrid", "On-Site"],
    },
    domain: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      required: true,
    },
    optionalSkills: {
      type: [String],
    },
    description: {
      type: String,
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    applicants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "interviewed", "rejected", "selected"],
          default: "pending",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    benchmarkScore: {
      type: String,
      default: "ALL",
      enum: ["25%", "50%", "75%", "100%"],
    },
    nop: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    extBenefits: {
      type: [String],
    },
    preferredJoiningDate: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// 🔍 Text index for searching jobs by role & skills
jobSchema.index({
  role: "text",
  requiredSkills: "text",
  optionalSkills: "text",
});

// 📍 Frequently queried fields
jobSchema.index({ location: 1 });
jobSchema.index({ domain: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdBy: 1 });
jobSchema.index({ updatedAt: -1 }); // for sorting job feeds

// ⚡ Compound index for job feed: active jobs by location sorted by recent updates
jobSchema.index({ status: 1, location: 1, updatedAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
