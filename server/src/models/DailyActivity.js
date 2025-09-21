const mongoose = require("mongoose");

const dailyActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day: { type: String, required: true }, // "YYYY-MM-DD" in user's TZ (e.g., Asia/Kolkata)
    count: { type: Number, default: 0 }, // green if >=1
  },
  { timestamps: true }
);

dailyActivitySchema.index({ userId: 1, day: 1 }, { unique: true }); // 1 doc per user per day
module.exports = mongoose.model("DailyActivity", dailyActivitySchema);
