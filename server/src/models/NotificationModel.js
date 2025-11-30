const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // 🔵 Who receives this notification?
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    receiverRole: {
      type: String,
      enum: ["job-seeker", "recruiter"],
      required: true,
      index: true,
    },

    // 🟢 Who triggered this notification?
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ["job-seeker", "recruiter"],
      required: true,
    },

    // Notification content
    type: { type: String, required: true }, // e.g., "INTERVIEW_SCHEDULED"
    title: { type: String },
    message: { type: String },

    // Extra metadata
    meta: { type: Object, default: {} },

    // Read / unread status
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
