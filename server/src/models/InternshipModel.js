const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    domain: {
      type: String,
      required: [true, "Internship domain is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Internship role is required"],
      trim: true,
    },
    about: {
      type: String,
      required: [true, "Internship description is required"],
    },
    requiredSkills: {
      type: [String],
      required: [true, "At least one required skill is needed"],
    },
    optionalSkills: {
      type: [String],
      default: [],
    },
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
    location: {
      type: String,
      enum: ["Remote", "Hybrid", "On-Site"],
      required: true,
    },
    preferredJoiningDate: {
      type: String,
      required: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    preferences: {
      GraduationYear: {
        type: Number,
        min: [2000, "Graduation year must be after 2000"],
        max: [2035, "Graduation year must be before 2035"],
        validate: {
          validator: function (v) {
            return v == null || (v >= 2000 && v <= 2035);
          },
          message: "Graduation year must be between 2000 and 2035",
        },
      },
      MinimumCGPA: {
        type: Number,
        min: [0, "CGPA cannot be negative"],
        max: [10, "CGPA cannot exceed 10"],
        validate: {
          validator: function (v) {
            return v == null || (!isNaN(v) && v >= 0 && v <= 10);
          },
          message: "CGPA must be between 0 and 10",
        },
      },
      OtherPreferences: { type: String, default: "" },
    },

    postedOn: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    // Reference to Application model
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
  },
  { timestamps: true }
);

// 🔍 Indexes for searching & filtering
internshipSchema.index({
  role: "text",
  domain: "text",
  about: "text",
  requiredSkills: "text",
  optionalSkills: "text",
});

internshipSchema.index({ location: 1 });
internshipSchema.index({ mode: 1 });
internshipSchema.index({ experienceLevel: 1 });
internshipSchema.index({ status: 1 });
internshipSchema.index({ company: 1 });
internshipSchema.index({ createdBy: 1 });
internshipSchema.index({ postedOn: -1 });
internshipSchema.index({ status: 1, location: 1, postedOn: -1 });

module.exports = mongoose.model("Internship", internshipSchema);
