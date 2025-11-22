// models/InterviewSchema.js (full updated file)
const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },

    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🚨 NEW: Reference to the original posting
    postingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Posting ID is required for interview"],
      index: true, // For faster queries
    },

    // 🚨 NEW: Type of posting (job or internship)
    postingType: {
      type: String,
      enum: ["job", "internship"], // Match your models
      required: [true, "Posting type (job/internship) is required"],
      lowercase: true, // Normalize
      index: true,
    },

    interviewDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
      default: "SCHEDULED",
    },

    // whether reminder job has been scheduled (helps avoid double-scheduling)
    reminderJobScheduled: {
      type: Boolean,
      default: false,
    },

    // whether reminder was already sent
    reminderSent: {
      type: Boolean,
      default: false,
    },

    reminderJobId: {
      // 🚨 NEW: Store BullMQ job ID for cancellation
      type: String,
      default: null,
    },

    uniqueCode: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🚨 NEW: Indexes for efficient querying
InterviewSchema.index({ postingId: 1, postingType: 1 });
InterviewSchema.index({ reminderSent: 1, reminderJobScheduled: 1 });

module.exports = mongoose.model("Interview", InterviewSchema);
