import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import apiClient, { getErrorMessage } from "../utils/apiClient";
import { CHAT_USER_STORAGE_KEY } from "../constants/app";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef(null);
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [pageMessage, setPageMessage] = useState(""); //页面级请求提示
  const [socketMessage, setSocketMessage] = useState(""); //socket连接提示

  useEffect(() => {
    const storedUser = localStorage.getItem(CHAT_USER_STORAGE_KEY);
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      setCurrentUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem(CHAT_USER_STORAGE_KEY);
      navigate("/login");
    }
  }, [navigate]);

  //建立socket连接
  useEffect(() => {
    if (!currentUser?._id) {
      return undefined;
    }

    const nextSocket = io(host, {
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    socket.current = nextSocket;

    const handleConnect = () => {
      setSocketMessage("");
      nextSocket.emit("add-user", currentUser._id);
    };

    const handleConnectError = () => {
      setSocketMessage("实时连接失败，正在尝试重新连接。");
    };

    const handleDisconnect = (reason) => {
      if (reason !== "io client disconnect") {
        setSocketMessage("实时连接已断开，消息可能会延迟。");
      }
    };

    nextSocket.on("connect", handleConnect);
    nextSocket.on("connect_error", handleConnectError);
    nextSocket.on("disconnect", handleDisconnect);

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("connect_error", handleConnectError);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.disconnect();
      socket.current = null;
    };
  }, [currentUser]);

  useEffect(() => {
    async function fetchContacts() {
      if (!currentUser?._id) {
        return;
      }

      try {
        setPageMessage("");
        const response = await apiClient.get(`${allUsersRoute}/${currentUser._id}`);
        setContacts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setContacts([]);
        setPageMessage(getErrorMessage(error, "联系人加载失败，请刷新页面重试。"));
      }
    }

    fetchContacts();
  }, [currentUser]);

  return (
    <Container>
      {(pageMessage || socketMessage) && (
        <div className="page-message">{pageMessage || socketMessage}</div>
      )}
      <div className="container">
        <Contacts
          contacts={contacts}
          currentUser={currentUser}
          changeChat={setCurrentChat}
        />
        <ChatContainer
          currentChat={currentChat}
          currentUser={currentUser}
          socket={socket}
        />
      </div>
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
  align-items: center;
  background-color: #131324;

  .page-message {
    width: 85vw;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background-color: #332940;
    color: #f6d9ff;
    font-size: 0.95rem;
  }

  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }

    @media screen and (max-width: 719px) {
      grid-template-columns: 1fr;
      width: 100vw;
      height: calc(100vh - 2rem);
    }
  }
`;
