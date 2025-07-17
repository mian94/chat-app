//实现聊天窗口页面
import React, { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";//生成唯一 ID，用于给每条消息分配 key，防止渲染错误。
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

//socket(ref)：	Socket.IO 客户端连接实例，用 useRef 包装
export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();//引用最后一条消息元素，用于滚动到底部
  const [arrivalMessage, setArrivalMessage] = useState(null);//接收到的新消息

  //获取历史聊天记录
  useEffect(() => {
    const fetchMessages = async () => {
      const user = JSON.parse(localStorage.getItem("chat-app-user"));
      if (user && currentChat) {
        const res = await axios.post(recieveMessageRoute, {
          from: user._id,
          to: currentChat._id,
        });
        setMessages(res.data);
      }
    };
    fetchMessages();
  }, [currentChat]);

  //获取当前聊天对象信息
  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem('chat-app-user')
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleSendMsg = (msg) => {
    const user = JSON.parse(localStorage.getItem("chat-app-user"));
    // 通过 WebSocket 发送消息
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: user._id,
      msg,
    });
    // 通过 HTTP 请求保存消息
    axios.post(sendMessageRoute, {
      from: user._id,
      to: currentChat._id,
      message: msg,
    });
    // 本地更新消息列表
    setMessages([
      ...messages,
      { fromSelf: true, message: msg }
    ]);
  };

  //监听实时消息
  useEffect(() => {
    //socket 是一个通过 useRef 创建的引用，指向 WebSocket 连接对象（如 Socket.IO 的实例）。
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        //fromSelf: false表示这条消息不是当前用户自己发送的。
        setArrivalMessage({ fromSelf: false, message: msg });
      });
    }
  }, []);

  //更新聊天记录
  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  //自动滚动到底部
  useEffect(() => {
    //使用 scrollIntoView() 方法将某个 DOM 元素滚动到可视区域。
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="chat-header">
        <div className="user-details">
          <div className="username">
            <h3>{currentChat?.username}</h3>
          </div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                //判断消息是自己发的还是别人发的，用于不同样式展示
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content ">
                  <p>{message.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </>
  );
}