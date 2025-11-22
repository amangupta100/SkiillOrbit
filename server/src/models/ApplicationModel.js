const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ direct index
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      index: true,
    },

    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      index: true,
    },
    atsScore: Number,
    applicationType: {
      type: String,
      enum: ["Job", "Internship"],
      required: true,
      index: true, // ✅ speeds up filtering per type
    },

    coverLetter: {
      type: String,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "seen",
        "shortlisted",
        "interview_scheduled",
        "interviewed",
        "offered",
        "selected",
        "rejected",
        "withdrawn",
      ],
      default: "pending",
      index: true, // ✅ common filter on dashboard
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      default: null,
      index: true,
    },

    interviewDate: {
      type: Date,
      default: null,
      index: true, // ✅ helps sorting
    },

    appliedAt: {
      type: Date,
      default: Date.now,
      index: true, // ✅ useful for sorting newest first
    },

    // ✅ NEW: Store user’s resume at time of application
    resumeSnapshot: {
      data: Buffer,
      contentType: String,
      filename: String,
      lastModified: Date,
    },
  },
  {
    timestamps: true,
  }
);

/*
 ✅ Extra Compound Indexes
  - Faster filtering like:
      find applications by status + job
      find by user + status
      get all shortlisted candidates for a job quickly
*/

applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ internship: 1, status: 1 });
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ applicationType: 1, status: 1 });
applicationSchema.index({ appliedAt: -1 }); // sort by latest

module.exports = mongoose.model("Application", applicationSchema);
