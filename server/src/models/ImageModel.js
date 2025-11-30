const mongoose = require("mongoose");

const UserImageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },

    imageBase64: {
      type: String,
      required: true,
    }, // stored Base64 string

    contentType: String,
    lastModified: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserImage", UserImageSchema);
