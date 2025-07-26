import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";//实现实时通信（WebSocket）
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import styled from "styled-components";

export default function Chat() {
  const navigate = useNavigate();
  //使用 useRef 来保存 socket 实例，确保在整个组件生命周期中都能访问到同一个 socket 连接。
  const socket = useRef();
  const [contacts, setContacts] = useState([]);//显示联系人列表
  const [currentChat, setCurrentChat] = useState(undefined);//当前正在聊天的对象
  const [currentUser, setCurrentUser] = useState(undefined);//当前用户
  
  //检查用户是否已登录
  useEffect(() => {
    const checkUser = async () => {
      if (!localStorage.getItem('chat-app-user')) {
        navigate("/login");//本地存储不存在 'chat-app-user' 键，跳转到登录页面
      } else {
        const user = JSON.parse(localStorage.getItem('chat-app-user'));
        setCurrentUser(user);
      }
    };
    checkUser();
  }, [navigate]);// 依赖数组，只有当 navigate 发生变化时才会重新执行此 effect

  //初始化 WebSocket 并注册用户
  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);//登录成功，连接到 WebSocket 服务器
      //发送 "add-user" 事件给服务器，携带当前用户的 ID，表示该用户上线。
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  //加载联系人列表
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        const res = await axios.get(`${allUsersRoute}/${currentUser._id}`);
        setContacts(res.data);
      }
    };
    fetchContacts();
  }, [currentUser]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };
  return (
    <>
      <Container>
        <div className="container">
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          <ChatContainer currentChat={currentChat} socket={socket} />
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;