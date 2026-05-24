const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const axios = require("axios");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const User = require("./models/userModel");
const Message = require("./models/messageModel");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const requestLogger = require("./middleware/requestLogger");
const { getUploadCategory, upload } = require("./middleware/upload");
const { hasMessageContent, normalizeMessageContent } = require("./utils/normalizeMessage");
const AppError = require("./utils/AppError");
const logger = require("./utils/logger");
const {
  clientOrigins,
  mongoConnectTimeoutMs,
  mongoUrl,
  port,
  qwenApiKey,
  uploadDir,
} = require("./config/env");

const app = express();
let httpServer = null; //保存最终启动后的 HTTP 服务对象，后面关闭服务时会用到

global.AI_USER_ID = null;
global.onlineUsers = new Map(); //保存当前用户映射关系：userId -> socket.id

//注册中间件
app.use(cors({
  origin: clientOrigins,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

//注册路由和上传接口
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);
app.post("/api/upload", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("No file uploaded.", 400));
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const fileType = getUploadCategory(req.file.mimetype);

    return res.json({
      success: true,
      url: fileUrl,
      type: fileType,
      filename: req.file.originalname,
    });
  } catch (error) {
    next(error); //把错误交给全局错误处理中间件
  }
});

//静态文件访问
app.use(
  "/uploads",
  express.static(uploadDir, {
    setHeaders(res, filePath) {
      const extension = path.extname(filePath).toLowerCase();
      const inlineExtensions = new Set([".jpg", ".jpeg", ".png", ".mp4"]);

      res.setHeader("X-Content-Type-Options", "nosniff");
      if (!inlineExtensions.has(extension)) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);

app.use(notFound); //处理没命中的路由
app.use(errorHandler); //处理整个请求链路里抛出的错误

//AI用户初始化
async function ensureAiUser() {
  try {
    //查数据库里有没有用户名是“通义千问”的用户
    const existingAiUser = await User.findOne({ username: "通义千问" });
    //如果有，就把它的 _id 存到 global.AI_USER_ID
    if (existingAiUser) {
      global.AI_USER_ID = existingAiUser._id;
      logger.info("AI user loaded", { aiUserId: String(existingAiUser._id) });
      return;
    }

    //如果没有，就创建一个 AI 用户
    const aiUser = await User.create({
      username: "通义千问",
      email: "ai-qwen@alibaba.com",
      password: "fakepassword",
      isAI: true,
    });
    //创建后同样保存 _id
    global.AI_USER_ID = aiUser._id;
    logger.info("AI user created", { aiUserId: String(aiUser._id) });
  } catch (error) {
    logger.error("Failed to prepare AI user", { message: error.message });
  }
}

//调用AI接口
async function callQwenApi(messageText, userId, aiUserId) {
  if (!qwenApiKey) {
    throw new AppError("Qwen API key is not configured.", 503);
  }

  if (!messageText?.trim()) {
    return {
      text: "当前 AI 对话只支持文本消息，请先输入文字。",
      mediaUrl: null,
      mediaType: null,
      fileName: null,
    };
  }

  logger.info("Calling Qwen API", { userId });

  //服务端主动请求通义千问接口
  const response = await axios.post(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    {
      model: "qwen-turbo",
      input: {
        messages: [
          {
            role: "system",
            content: "你是一个乐于助人的AI助手，名叫通义千问。请用友好、简洁的中文回答问题。",
          },
          { role: "user", content: messageText },
        ],
      },
      parameters: {
        result_format: "message",
        max_tokens: 1024,
        temperature: 0.7,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${qwenApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  //提取AI回复
  const aiReply = response.data?.output?.choices?.[0]?.message?.content?.trim();
  if (!aiReply) {
    throw new AppError("AI service returned an empty response.", 502);
  }

  const messageData = {
    text: aiReply,
    mediaUrl: null,
    mediaType: null,
    fileName: null,
  };

  //AI回复发给前端并持久化保存
  await Message.create({
    message: messageData,
    users: [userId, aiUserId],
    sender: aiUserId,
  });

  return messageData;
}

//Socket配置
function configureSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: clientOrigins,
      credentials: true,  
    },
  });

  io.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });

    socket.on("error", (error) => {
      logger.error("Socket error", { message: error.message, socketId: socket.id });
    });

    socket.on("disconnect", (reason) => {
      let disconnectedUserId = null;

      for (const [userId, socketId] of global.onlineUsers.entries()) {
        if (socketId === socket.id) {
          global.onlineUsers.delete(userId);
          disconnectedUserId = userId;
          break;
        }
      }

      logger.info("Socket disconnected", {
        reason,
        socketId: socket.id,
        userId: disconnectedUserId,
      });
    });

    socket.on("add-user", (userId) => {
      if (!userId) {
        return;
      }

      global.onlineUsers.set(userId, socket.id);
      logger.info("User joined socket room", { socketId: socket.id, userId });
    });

    socket.on("send-msg", async (payload) => {
      try {
        //基础校验
        const from = payload?.from;
        const to = payload?.to;
        const normalizedMessage = normalizeMessageContent(payload?.msg);

        if (!from || !to || !hasMessageContent(normalizedMessage)) {
          logger.warn("Ignored invalid socket message", { payload });
          return;
        }

        //如果发消息给AI
        const aiUserId = global.AI_USER_ID?.toString();
        if (aiUserId && to === aiUserId) {
          const aiReply = await callQwenApi(normalizedMessage.text, from, aiUserId);
          const senderSocketId = global.onlineUsers.get(from);

          if (senderSocketId) {
            io.to(senderSocketId).emit("msg-recieve", {
              from: aiUserId,
              to: from,
              msg: aiReply,
            });
          }

          return;
        }

        //如果消息发给普通用户
        const targetSocketId = global.onlineUsers.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit("msg-recieve", {
            from,
            to,
            msg: normalizedMessage,
          });
        }

        logger.info("Socket message dispatched", {
          from,
          to,
          delivered: Boolean(targetSocketId),
        });
      } catch (error) {
        logger.error("Socket send-msg handler failed", {
          message: error.message,
          socketId: socket.id,
        });

        const senderSocketId = global.onlineUsers.get(payload?.from);
        if (senderSocketId) {
          io.to(senderSocketId).emit("msg-recieve", {
            from: global.AI_USER_ID?.toString() || "system",
            to: payload?.from,
            msg: {
              text: "抱歉，消息处理失败，请稍后再试。",
              mediaUrl: null,
              mediaType: null,
              fileName: null,
            },
          });
        }
      }
    });
  });
}

async function startServer() {
  //检查 Mongo 配置
  if (!mongoUrl) {
    throw new Error("MONGO_URL is required before starting the server.");
  }

  //连接数据库
  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: mongoConnectTimeoutMs,
  });
  logger.info("MongoDB connected");
  //初始化 AI 用户
  await ensureAiUser();

  // 启动 HTTP 服务
  httpServer = app.listen(port, () => {
    logger.info("Server started", { port });
  });

  //启动 Socket.IO
  configureSocket(httpServer);
}

function shutdown(exitCode) {
  logger.error("Server is shutting down", { exitCode });

  if (httpServer) {
    httpServer.close(() => {
      process.exit(exitCode);
    });
    return;
  }

  process.exit(exitCode);
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  shutdown(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message });
  shutdown(1);
});

startServer().catch((error) => {
  logger.error("Failed to start server", { message: error.message });
  shutdown(1);
});
