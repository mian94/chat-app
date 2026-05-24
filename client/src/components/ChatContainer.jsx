import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { recieveMessageRoute, sendMessageRoute } from "../utils/APIRoutes";
import apiClient, { getErrorMessage } from "../utils/apiClient";
import { DEFAULT_MESSAGE_PAGE_SIZE } from "../constants/app";
import { throttle } from "../utils/throttle";

function normalizeMessage(message) {
  if (typeof message === "string") {
    return {
      text: message,
      mediaUrl: null,
      mediaType: null,
      fileName: null,
    };
  }

  return {
    text: message?.text || "",
    mediaUrl: message?.mediaUrl || null,
    mediaType: message?.mediaType || null,
    fileName: message?.fileName || null,
  };
}

export default function ChatContainer({ currentChat, currentUser, socket }) {
  const [messages, setMessages] = useState([]); //当前会话消息列表
  const [cursor, setCursor] = useState(null); //分页游标，指向下一次加载历史消息的位置  
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false); //首次加载消息中
  const [isLoadingMore, setIsLoadingMore] = useState(false); //正在向上加载更多历史消息
  const [errorMessage, setErrorMessage] = useState("");
  const listRef = useRef(null); //指向消息滚动容器 DOM
  const bottomRef = useRef(null); //指向底部锚点元素，用于滚动到底部
  const activeConversationRef = useRef(""); //保存当前会话标识，防止旧请求回来的结果覆盖新会话
  const pendingScrollHeightRef = useRef(null); //记录加载更多前的滚动高度，用来保持滚动位置不跳
  const shouldScrollToBottomRef = useRef(false); //标记消息更新后是否应该滚到底部
  const loadMoreRef = useRef(() => {}); //保存“加载更多历史消息”的函数引用
  const fetchMessagesRef = useRef(() => {}); //保存“获取消息”的函数引用
  const throttledScrollHandlerRef = useRef(null); //保存节流后的滚动处理函数

  const currentUserId = currentUser?._id;
  const currentChatId = currentChat?._id;

  async function fetchMessages({ nextCursor = null, prepend = false } = {}) {
    if (!currentUserId || !currentChatId) {
      return;
    }

    const conversationKey = `${currentUserId}-${currentChatId}`;
    activeConversationRef.current = conversationKey;
    let shouldUpdateLoadingState = true;

    try {
      setErrorMessage("");  

      if (prepend) {
        setIsLoadingMore(true);
        if (listRef.current) {
          pendingScrollHeightRef.current = listRef.current.scrollHeight;
        }
      } else {
        setIsInitialLoading(true);
      }

      const response = await apiClient.post(recieveMessageRoute, {
        from: currentUserId,
        to: currentChatId,
        cursor: nextCursor,
        pageSize: DEFAULT_MESSAGE_PAGE_SIZE,
      });

      if (activeConversationRef.current !== conversationKey) {
        return;
      }

      const payload = response.data || {};
      const incomingMessages = Array.isArray(payload.messages) ? payload.messages : [];

      setMessages((previousMessages) =>
        prepend ? [...incomingMessages, ...previousMessages] : incomingMessages
      );
      setCursor(payload.nextCursor || null);
      setHasMoreHistory(Boolean(payload.hasMore));

      if (!prepend) {
        shouldScrollToBottomRef.current = true;
      }
    } catch (error) {
      if (activeConversationRef.current !== conversationKey) {
        shouldUpdateLoadingState = false;
        return;
      }

      setErrorMessage(getErrorMessage(error, "消息加载失败，请稍后重试。"));
      pendingScrollHeightRef.current = null;
    } finally {
      if (shouldUpdateLoadingState && activeConversationRef.current === conversationKey) {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    }
  }

  fetchMessagesRef.current = fetchMessages;

  loadMoreRef.current = () => {
    if (!cursor || !hasMoreHistory || isLoadingMore || isInitialLoading) {
      return;
    }

    fetchMessages({ nextCursor: cursor, prepend: true });
  };

  //节流滚动处理
  if (!throttledScrollHandlerRef.current) {
    throttledScrollHandlerRef.current = throttle(() => {
      const listElement = listRef.current;
      if (!listElement || listElement.scrollTop > 60) {
        return;
      }

      loadMoreRef.current();
    }, 300);
  }

  //切换会话时加载消息
  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMoreHistory(false);
    setErrorMessage("");
    pendingScrollHeightRef.current = null;

    if (!currentUserId || !currentChatId) {
      return;
    }

    fetchMessagesRef.current();
  }, [currentChatId, currentUserId]);

  //监听实时消息
  useEffect(() => {
    const currentSocket = socket.current;
    if (!currentSocket || !currentUserId || !currentChatId) {
      return undefined;
    }

    const handleMessageReceive = (payload) => {
      const participantIds = [payload?.from, payload?.to];
      const isCurrentConversation = participantIds.includes(currentUserId)
        && participantIds.includes(currentChatId);

      if (!isCurrentConversation) {
        return;
      }

      shouldScrollToBottomRef.current = true;
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: payload.id || `${Date.now()}-${Math.random()}`,
          createdAt: payload.createdAt || new Date().toISOString(),
          fromSelf: false,
          message: normalizeMessage(payload.msg),
        },
      ]);
    };

    currentSocket.on("msg-recieve", handleMessageReceive);

    return () => {
      currentSocket.off("msg-recieve", handleMessageReceive);
    };
  }, [currentChatId, currentUserId, socket]);

  //自动滚动
  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    if (pendingScrollHeightRef.current !== null) {
      const previousHeight = pendingScrollHeightRef.current;
      pendingScrollHeightRef.current = null;
      listRef.current.scrollTop = listRef.current.scrollHeight - previousHeight;
      return;
    }

    if (shouldScrollToBottomRef.current) {
      shouldScrollToBottomRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMsg = async (messageContent) => {
    if (!currentUserId || !currentChatId) {
      return;
    }

    try {
      setErrorMessage("");

      //调用接口把消息存到数据库
      const response = await apiClient.post(sendMessageRoute, {
        from: currentUserId,
        to: currentChatId,
        message: messageContent,
      });

      //成功后把消息先加到本地列表
      const savedMessage = response.data?.data || {
        id: `${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        fromSelf: true,
        message: normalizeMessage(messageContent),
      };

      shouldScrollToBottomRef.current = true;
      setMessages((previousMessages) => [...previousMessages, savedMessage]);

      //再通过 socket 通知对方实时接收
      socket.current?.emit("send-msg", {
        to: currentChatId,
        from: currentUserId,
        msg: savedMessage.message,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "消息发送失败，请稍后重试。"));
      throw error;
    }
  };

  if (!currentChat) {
    return (
      <EmptyState>
        <div className="content">
          <h2>选择一个联系人开始聊天</h2>
        </div>
      </EmptyState>
    );
  }

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>

      <div
        className="chat-messages"
        ref={listRef}
        onScroll={() => throttledScrollHandlerRef.current?.()}
      >
        {(hasMoreHistory || isLoadingMore) && (
          <div className="history-indicator">
            {isLoadingMore ? "正在加载更早消息..." : "上滑可继续加载更早消息"}
          </div>
        )}

        {isInitialLoading ? (
          <div className="status-message">正在加载聊天记录...</div>
        ) : messages.length === 0 ? (
          <div className="status-message">当前还没有聊天记录，发一条消息试试。</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message-row">
              <div className={`message ${message.fromSelf ? "sended" : "recieved"}`}>
                <div className="content">
                  {message.message.mediaUrl ? (
                    message.message.mediaType === "image" ? (
                      <img src={message.message.mediaUrl} alt={message.message.fileName || "image"} />
                    ) : message.message.mediaType === "video" ? (
                      <video controls>
                        <source src={message.message.mediaUrl} type="video/mp4" />
                        当前浏览器不支持该视频播放。
                      </video>
                    ) : (
                      <a
                        href={message.message.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        下载文件：{message.message.fileName || "未命名文件"}
                      </a>
                    )
                  ) : (
                    <p>{message.message.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-footer">
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <ChatInput handleSendMsg={handleSendMsg} />
      </div>
    </Container>
  );
}

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #080420;
  color: white;
  padding: 2rem;
  text-align: center;

  .content {
    max-width: 26rem;
  }

  h2 {
    margin-bottom: 0.75rem;
  }

  p {
    color: #c9c2ff;
    line-height: 1.6;
  }
`;

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 78% 12%;
  gap: 0.1rem;
  overflow: hidden;

  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 12% 74% 14%;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;

    .username {
      h3 {
        color: white;
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
  }

  .history-indicator,
  .status-message {
    align-self: center;
    color: #c7c1ff;
    font-size: 0.95rem;
  }

  .message {
    display: flex;
    align-items: center;

    .content {
      max-width: 40%;
      overflow-wrap: break-word;
      padding: 1rem;
      font-size: 1.05rem;
      border-radius: 1rem;
      color: #d1d1d1;

      @media screen and (min-width: 720px) and (max-width: 1080px) {
        max-width: 70%;
      }

      @media screen and (max-width: 719px) {
        max-width: 85%;
        font-size: 1rem;
        padding: 0.8rem;
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

  .chat-footer {
    display: flex;
    flex-direction: column;
  }

  .error-message {
    padding: 0.35rem 2rem 0;
    color: #ff9eb4;
    font-size: 0.9rem;
  }

  img,
  video {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
  }

  a {
    color: #d8d3ff;
  }
`;
