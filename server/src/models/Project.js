const mongoose = require("mongoose");

const UserProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    description: { type: String, required: true },

    // 💡 Project Links (GitHub, Demo, Case study, etc.)
    links: [
      {
        type: String,
      },
    ],

    // 💡 Skills used
    skills: { type: [String], default: [] },

    // 📸 Media Section
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video", "link"], // image = base64, video = URL, link = any external resource
          required: true,
        },

        // Base64 image only used when type: "image"
        imageBase64: { type: String },

        // Video URL (YouTube, Vimeo, MP4)
        videoUrl: { type: String },

        // External link (Figma, GitHub pages, website)
        externalLink: { type: String },

        caption: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProject", UserProjectSchema);
