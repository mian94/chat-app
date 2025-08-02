const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");
const axios = require('axios');

const app = express();
require("dotenv").config(); //加载 .env 文件中定义的环境变量。

app.use(cors());
app.use(express.json());

app.use("/api/auth",userRoutes);
app.use("/api/messages", messageRoutes);


mongoose
.connect(process.env.MONGO_URL)
.then(() => {
    console.log("DB Connection Successful");
})
.catch((err) => {
    console.log(err.message);
});

//启动服务器并监听指定端口
const server = app.listen(process.env.PORT,() => {
    console.log(`Server Started on Port ${process.env.PORT}`);
});

//初始化Socket.IO
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

//API函数
async function callQwenApi(msg) {
  console.log("Calling Qwen API with message:", msg);
  try {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',//API 端点
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: '你是一个乐于助人的AI助手，名叫通义千问。请用友好、简洁的中文回答问题。' },
            { role: 'user', content: msg }
          ]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 1024, // 限制回复长度
          temperature: 0.7, // 控制回复的随机性
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.QWEN_API_KEY}`, // 使用 Bearer Token 认证
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("Qwen API Response Status:", response.status); // 检查状态码
    console.log("Qwen API Response Data:", JSON.stringify(response.data, null, 2)); //打印完整的响应数据
    return response.data.output?.text || response.data.output?.choices?.[0]?.message?.content;
  } catch (error) {
    console.error("Error calling Qwen API:", error);
    throw error; // 抛出错误以便外部处理
  }
}

//全局变量onlineUsers存储当前在线用户的映射关系，键为用户ID，值为该用户的socket ID。
global.onlineUsers = new Map();

const AI_USER_ID = "ai-qwen";

//定义一个 Map 来存储 userId -> current socket.id
const userSocketMap = new Map();

//新的客户端连接到服务器时
io.on("connection", (socket) => {
  global.chatSocket = socket;

  //立即监听 disconnect 事件（在 add-user 之前）
  socket.on("disconnect",() => {
    let removedUserId = null;
    for(const [userId,socketId] of onlineUsers.entries()){
      if(socketId===socket.id){
        onlineUsers.delete(userId);
        userSocketMap.delete(userId); // 同步删除 userSocketMap 中的记录
        removedUserId = userId;
        break;
      }
    }
    if(removedUserId) {
      console.log(`User ${removedUserId} disconnected (Socket ID: ${socket.id}) and removed from online list.`);
    }else{
      console.log(`Socket disconnected (Socket ID: ${socket.id}), but no matching user found in online list.`);
    }
  });

  //用户上线
  socket.on("add-user", (userId) => {
    userSocketMap.set(userId, socket.id); //关键：使用 Map 存储最新 socket.id
    onlineUsers.set(userId, socket.id);
  });

  //消息发送（当一个客户端发送一条消息时，服务器查找目标用户是否在线，如果在线，就把消息转发给该用户。）
  socket.on("send-msg", async (data) => {
    const {from,to,msg} =data;

    // 检查消息是否是发给 AI 机器人的
    if(to===AI_USER_ID){
      console.log("Message is for AI. Calling Qwen API...");
      try{
        //直接调用通义千问 API
        const aiReply = await callQwenApi(msg); // 使用上面定义的 callQwenApi 函数
        console.log("Qwen API Response:", aiReply); 
        // 构造回复消息，from 是 AI 的 ID，to 是原始发送者
        const replyData = {
          from:AI_USER_ID,
          to:from,
          msg:aiReply,
        };

        // 查找原始发送者的 socket ID
        const senderSocketId = userSocketMap.get(from); // 使用 userSocketMap 获取最新的 socket.id

        if(senderSocketId){
          // 向原始发送者发送 AI 的回复
          console.log("【BACKEND】Emitting msg-recieve to socket:", senderSocketId, "with data:", replyData);
          io.to(senderSocketId).emit("msg-recieve",replyData);// 使用 io.to 而不是 socket.to
          console.log("【BACKEND】Emit msg-recieve completed.");
        }else{
          // 如果发送者不在线，可以考虑存入数据库作为离线消息（可选）
          console.log(`User ${from} is offline. AI reply stored.`);
        }
      }catch(error){
        console.error("Error calling Qwen API:", error);
        // 发送一个错误消息给用户
        const errorData = {
          from:AI_USER_ID,
          to:from,
          msg:"抱歉，AI服务暂时不可用，请稍后再试。",
        };
        const senderSocketId = onlineUsers.get(from);
        if(senderSocketId){
          socket.to(senderSocketId).emit("msg-recieve",errorData);
        }
      }
    }else{
      // 消息是发给普通用户的，执行原有逻辑
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        //在 Socket.IO 中，每个 socket ID 可以看作一个私有房间，所以 socket.to(sendUserSocket) 就表示向这个 socket ID 对应的客户端发送消息。
        socket.to(sendUserSocket).emit("msg-recieve", data.msg);
      }
    }
  });
});

