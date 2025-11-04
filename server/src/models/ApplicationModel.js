const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Can be linked to either a Job or Internship
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
    },

    // Track application type for easier queries
    applicationType: {
      type: String,
      enum: ["Job", "Internship"],
      required: true,
    },

    // Optional cover letter or notes
    coverLetter: {
      type: String,
      maxlength: 3000,
    },

    // Application status lifecycle
    status: {
      type: String,
      enum: [
        "pending", // Submitted but not reviewed
        "seen", // Viewed by recruiter
        "shortlisted", // Selected for next stage
        "interview_scheduled", // Interview date set
        "interviewed", // Interview completed
        "offered", // Offer extended
        "selected", // Candidate accepted offer
        "rejected", // Not selected
        "withdrawn", // Candidate withdrew
      ],
      default: "pending",
    },

    // Optional: track recruiter actions
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      default: null,
    },

    interviewDate: {
      type: Date,
      default: null,
    },

    feedback: {
      type: String,
      maxlength: 2000,
      default: null,
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ user: 1 });
applicationSchema.index({ job: 1 });
applicationSchema.index({ internship: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationType: 1, status: 1 });
applicationSchema.index({ appliedAt: -1 }); // For sorting latest applications

module.exports = mongoose.model("Application", applicationSchema);
