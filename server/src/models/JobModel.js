const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      required: [true, "At least one required skill is needed"],
    },
    optionalSkills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,

      required: true,
    },
    nop: {
      type: Number,
      required: [true, "Number of positions is required"],
      min: [1, "At least one position must be available"],
    },
    salaryRange: {
      min: {
        type: Number,
        required: [true, "Minimum salary is required"],
        min: [0, "Salary cannot be negative"],
      },
      max: {
        type: Number,
        required: [true, "Maximum salary is required"],
        validate: {
          validator: function (v) {
            return v >= this.salaryRange.min;
          },
          message: "Maximum salary must be greater than minimum salary",
        },
      },
    },
    location: {
      type: String,
      enum: ["Remote", "Hybrid", "On-Site"],
      default: "Remote",
    },
    benchmarkScore: {
      type: String,
      enum: ["ALL", "25%", "50%", "75%", "100%"],
      default: "ALL",
    },
    preferredJoiningDate: {
      type: String,
      required: true,
    },
    extBenefits: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    // Relationship reference to Application model
    applications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
    ],
  },
  { timestamps: true }
);

// 🔍 Indexes for faster searching and filtering
jobSchema.index({
  role: "text",
  domain: "text",
  requiredSkills: "text",
  optionalSkills: "text",
  description: "text",
});

jobSchema.index({ location: 1 });
jobSchema.index({ experience: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdBy: 1 });
jobSchema.index({ updatedAt: -1 });
jobSchema.index({ status: 1, location: 1, updatedAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
