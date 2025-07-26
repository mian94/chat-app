const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    //查询数据库中的聊天记录
    const messages = await Messages.find({
      users: {
        $all: [from, to],//使用 MongoDB 的 $all操作符查询包含这两个用户的对话记录。
      },
    }).sort({ updatedAt: 1 });//按照时间升序排列

    const projectedMessages = messages.map((msg) => {
      return {
        // 判断这条消息是不是由 from 用户（即当前用户）发送的。
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};
