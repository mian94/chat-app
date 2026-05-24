const mongoose = require("mongoose"); //这里主要用它做 ObjectId 校验
const Messages = require("../models/messageModel");
const AppError = require("../utils/AppError");
const {
  hasMessageContent,
  normalizeMessageContent,
} = require("../utils/normalizeMessage");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to, cursor } = req.body;
    const pageSize = Math.min(Math.max(Number(req.body.pageSize) || 20, 1), 50);

    if (!from || !to) {
      return next(new AppError("Both sender and receiver ids are required.", 400));
    }

    const query = {
      users: {
        $all: [from, to],
      },
    };

    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return next(new AppError("Invalid message cursor.", 400));
      }

      query._id = { $lt: cursor };
    }

    const messages = await Messages.find(query)
      .sort({ _id: -1 })
      .limit(pageSize + 1);

    const hasMore = messages.length > pageSize;
    const pagedMessages = hasMore ? messages.slice(0, pageSize) : messages;
    const orderedMessages = pagedMessages.reverse();

    const projectedMessages = orderedMessages.map((messageDoc) => ({
      id: messageDoc._id,
      createdAt: messageDoc.createdAt,
      fromSelf: messageDoc.sender.toString() === from,
      message: normalizeMessageContent(messageDoc.message),
    }));

    return res.json({
      success: true,
      messages: projectedMessages,
      hasMore,
      nextCursor: hasMore ? projectedMessages[0]?.id || null : null,
      pageSize,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    if (!from || !to) {
      return next(new AppError("Both sender and receiver ids are required.", 400));
    }

    const messageData = normalizeMessageContent(message);
    if (!hasMessageContent(messageData)) {
      return next(new AppError("Message content can not be empty.", 400));
    }

    const data = await Messages.create({
      message: messageData,
      users: [from, to],
      sender: from,
    });

    return res.json({
      success: true,
      msg: "Message added successfully.",
      data: {
        id: data._id,
        createdAt: data.createdAt,
        fromSelf: true,
        message: messageData,
      },
    });
  } catch (error) {
    next(error);
  }
};
