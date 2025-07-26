const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
    },
    users: Array,
    //标识这条消息的发送者
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  //自动为文档添加 createdAt 和 updatedAt 时间戳字段（文档创建时间，文档最后更新时间）
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", MessageSchema);
