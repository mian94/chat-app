const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      type: {
        text: { type: String, default: "" },
        mediaUrl: { type: String, default: null },
        mediaType: { type: String, default: null },
        fileName: { type: String, default: null },
      },
      required: true,
    },
    users: {
      type: [String],
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ users: 1, createdAt: -1 });

module.exports = mongoose.model("Messages", MessageSchema);
