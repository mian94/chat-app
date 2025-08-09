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
      //确保 message 是对象格式
      const messageContent = typeof msg.message === 'string'
        ? { text: msg.message, mediaUrl: null, mediaType: null,fileName: null }
        : {
            text: msg.message.text || "",
            mediaUrl: msg.message.mediaUrl || null,
            mediaType: msg.message.mediaType || null,
            fileName: msg.message.fileName || null
          };
      return {
        // 判断这条消息是不是由 from 用户（即当前用户）发送的。
        fromSelf: msg.sender.toString() === from,
        message: messageContent,
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
    
    let messageData;

    if (typeof message === 'string') {
      // 兼容旧的字符串格式（可逐步淘汰）
      messageData = {
        text: message,
        mediaUrl: null,
        mediaType: null,
        fileName:null
      };
    } else if (typeof message === 'object' && message !== null) {
      // 正常对象格式
      messageData = {
        text: message.text || "",
        mediaUrl: message.mediaUrl || null,
        mediaType: message.mediaType || null,
        fileName:message.fileName || null,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid message format. Expected string or object."
      });
    }

    // 创建新消息
    const data = await Messages.create({
      message: messageData,
      users: [from, to],
      sender: from,
    });

    if (data) {
      return res.json({
        success: true,
        msg: "Message added successfully.",
        data: {
          id: data._id,
          fromSelf: true,
          message: messageData,
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        msg: "Failed to add message to the database"
      });
    }
  } catch (ex) {
    console.error("Error in addMessage:", ex);
    next(ex);
  }
};