const mongoose = require("mongoose");

// 🧩 Subschema for messages
const messageSubSchema = new mongoose.Schema(
  {
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "Recruiter"],
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "messages.senderModel",
    },

    // 🟢 ADD THESE TWO FIELDS:
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "messages.receiverModel",
    },
    receiverModel: {
      type: String,
      enum: ["User", "Recruiter"],
    },

    content: { type: String, trim: true },
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video", "file", "audio", "link"],
          required: true,
        },
        url: { type: String, required: true },
        thumbnail: String,
        meta: {
          size: Number,
          width: Number,
          height: Number,
          duration: Number,
          title: String,
          description: String,
        },
      },
    ],
    replyTo: { type: mongoose.Schema.Types.ObjectId },
    reactions: [
      {
        emoji: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// 🧠 Main Chat Schema
const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      index: true,
    },
    name: { type: String, trim: true, default: null },
    description: { type: String, trim: true },
    avatar: String,

    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "members.userModel",
        },
        userModel: {
          type: String,
          enum: ["User", "Recruiter"],
          required: true,
        },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
        lastReadMessageId: { type: mongoose.Schema.Types.ObjectId },
      },
    ],

    // 🗨️ Embedded messages
    messages: [messageSubSchema],

    // 🕊️ Last message (stored as embedded object, not ObjectId)
    lastMessage: {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "lastMessage.senderModel",
      },
      senderModel: {
        type: String,
        enum: ["User", "Recruiter"],
      },
      content: String,
      media: [
        {
          type: {
            type: String,
            enum: ["image", "video", "file", "audio", "link"],
          },
          url: String,
        },
      ],
      status: { type: String, default: "sent" },
      createdAt: Date,
    },

    createdByModel: {
      type: String,
      required: true,
      enum: ["User", "Recruiter"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },

    isArchived: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ⚡ Performance indexes
chatSchema.index({ "members.userId": 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ createdBy: 1 });
chatSchema.index({ createdByModel: 1 });

module.exports = mongoose.model("Chat", chatSchema);
