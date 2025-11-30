const mongoose = require("mongoose");

const UserEducationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    degree: String,
    institution: String,
    startYear: Date,
    endYear: Date,
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

module.exports = mongoose.model("UserEducation", UserEducationSchema);
