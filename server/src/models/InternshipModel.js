const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Internship title is required"],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      required: [true, "At least one required skill is needed"],
    },
    optionalSkills: [String],
    duration: {
      type: String,
      required: true,
    },
    stipend: {
      min: {
        type: Number,
        required: true,
        min: [0, "Stipend cannot be negative"],
      },
      max: {
        type: Number,
        required: true,
        validate: {
          validator: function (v) {
            return v >= this.stipend.min;
          },
          message: "Max stipend must be greater than min stipend",
        },
      },
    },
    positionsAvailable: {
      type: Number,
      required: true,
      min: [1, "At least one position must be available"],
    },
    benchmarkScore: {
      type: String,
      enum: ["ALL", "25%", "50%", "75%", "100%"],
      default: "ALL",
    },
    location: {
      type: String,
      enum: ["Remote", "Hybrid", "On-Site"],
      required: true,
    },
    preferredJoiningDate: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ["Part-Time", "Semi-Full-Time", "Full-Time"],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    benefits: [String],
    preferences: {
      GraduationYear: {
        type: Number,
        min: [2000, "Graduation year must be after 2000"],
        max: [2030, "Graduation year must be before 2030"],
      },
      MinimumCGPA: {
        type: Number,
        min: [0, "CGPA cannot be negative"],
        max: [10, "CGPA cannot exceed 10"],
      },
      OtherPreferences: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    postedOn: {
      type: Date,
      default: Date.now,
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
  },
  {
    timestamps: true,
  }
);

// 🔍 Text index for searching internships by title & skills
internshipSchema.index({
  title: "text",
  requiredSkills: "text",
  optionalSkills: "text",
});

// 📍 Frequently queried single-field indexes
internshipSchema.index({ location: 1 });
internshipSchema.index({ mode: 1 });
internshipSchema.index({ experienceLevel: 1 });
internshipSchema.index({ status: 1 });
internshipSchema.index({ createdBy: 1 });
internshipSchema.index({ company: 1 });
internshipSchema.index({ postedOn: -1 });

// ⚡ Compound index: For dashboards / job feed (active internships by location sorted by date)
internshipSchema.index({ status: 1, location: 1, postedOn: -1 });

module.exports = mongoose.model("Internship", internshipSchema);
