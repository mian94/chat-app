const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");

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

//全局变量onlineUsers存储当前在线用户的映射关系，键为用户ID，值为该用户的socket ID。
global.onlineUsers = new Map();
//新的客户端连接到服务器时
io.on("connection", (socket) => {
  global.chatSocket = socket;
  //用户上线
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });
  //消息发送（当一个客户端发送一条消息时，服务器查找目标用户是否在线，如果在线，就把消息转发给该用户。）
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      //在 Socket.IO 中，每个 socket ID 可以看作一个私有房间，所以 socket.to(sendUserSocket) 就表示向这个 socket ID 对应的客户端发送消息。
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});

