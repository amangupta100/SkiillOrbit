const mongoose = require("mongoose");

const UserCertificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    title: String,
    issuer: String,
    issueDate: Date,
    credentialUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserCertification", UserCertificationSchema);
