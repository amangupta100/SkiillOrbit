const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      unique: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, index: true },

    description: { type: String, required: true },

    skills: { type: [String], required: true, index: true },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      required: true,
      index: true,
    },

    topicsCovered: { type: [String], default: [], index: true },
    starterCode: String,
    solutionCode: String,

    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },

    tags: { type: [String], index: true },

    attachments: [
      {
        fileUrl: String,
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// AUTO-INCREMENT SERIAL NUMBER
questionSchema.pre("save", async function () {
  if (!this.isNew) return;

  // Skip if already set to a valid number
  if (this.serialNumber != null) return;

  try {
    const lastQuestion = await this.constructor
      .findOne({ serialNumber: { $ne: null } }, { serialNumber: 1 })
      .sort({ serialNumber: -1 });

    this.serialNumber = lastQuestion ? lastQuestion.serialNumber + 1 : 1;
  } catch (err) {
    // Re-throw to reject the save promise
    throw err;
  }
});

module.exports = mongoose.model("Question", questionSchema);
