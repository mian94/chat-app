//实现聊天窗口页面
import React, { useState, useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";//生成唯一 ID，用于给每条消息分配 key，防止渲染错误
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";
import styled from "styled-components";
import Logout from "./Logout";

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
    const msgId = uuidv4(); // 在发送消息时生成唯一ID
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
      { id:msgId, fromSelf: true, message: msg }
    ]);
  };

  //监听实时消息
  useEffect(() => {
    //socket 是一个通过 useRef 创建的引用，指向 WebSocket 连接对象（如 Socket.IO 的实例）。
    if (socket.current) {
      socket.current.on("msg-recieve", (msgData) => {
        console.log("【DIAGNOSIS】Raw msg-recieve event fired!", msgData);
        //fromSelf: false表示这条消息不是当前用户自己发送的。
        setArrivalMessage({ id: uuidv4(), fromSelf: false, message: msgData.msg });
      });
    }
  }, [socket.current]);

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
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="username">
            <h3>{currentChat?.username}</h3>
          </div>
        </div>
        <Logout />
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
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;