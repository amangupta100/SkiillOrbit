const mongoose = require("mongoose");

const UserResumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    data: {
      type: Buffer,
      required: true,
    },
    contentType: String,
    filename: String,
    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserResume", UserResumeSchema);
