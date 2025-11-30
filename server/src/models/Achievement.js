const mongoose = require("mongoose");

const UserAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    title: String,
    description: String,
    year: Number,

    // ✅ Simple attachment object (link only)
    attachments: {
      type: {
        type: String,
        enum: ["link"], // only link supported
      },
      url: String, // link URL
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserAchievement", UserAchievementSchema);
