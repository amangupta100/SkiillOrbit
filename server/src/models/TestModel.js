const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // NEW — store ONLY question IDs
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    skills: {
      type: [String],
      required: true,
    },

    totalQuestions: Number,
    duration: String,

    startedAt: Date,
    submittedAt: Date,

    testCompleted: Boolean,

    SuspiciousFlags: [String],

    // NEW — user answer object
    uanswer: [
      {
        code: String, // ✔ only user code
        isCorrect: Boolean, // ✔ correctness
      },
    ],

    // NEW — correct answers + reason
    cAnswer: [
      {
        correctAnswer: String, // ✔ AI generated correct solution
        reason: String, // ✔ AI explanation
      },
    ],

    correctCount: Number,
    incorrectCount: Number,
    scorePercent: Number,
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
