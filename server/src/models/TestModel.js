const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: {
      type: [Object],
    },
    skills: {
      type: [String],
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    correctCount: Number,
    incorrectCount: Number,
    scorePercent: Number,
    startedAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    testCompleted: Boolean,
    SuspiciousFlags: [String],
    uanswer: {
      type: [Object],
    },
    canswer: {
      type: [Object],
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Compound index (user + skill + submission date)
testSchema.index({ userId: 1, skills: 1, submittedAt: -1 });

// ✅ Index for leaderboard-style queries
testSchema.index({ scorePercent: -1 });

// Optional: index for filtering by completion status
testSchema.index({ testCompleted: 1 });

module.exports = mongoose.model("Test", testSchema);
