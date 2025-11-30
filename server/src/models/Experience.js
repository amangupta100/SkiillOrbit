const mongoose = require("mongoose");

const UserExperienceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    company: String,
    role: String,
    from: Date,
    to: Date,
    description: String,

    // 🌐 Attachments only for link
    attachments: [
      {
        type: {
          type: String,
          enum: ["link"], // only link attachments allowed
          required: true,
        },

        url: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserExperience", UserExperienceSchema);
