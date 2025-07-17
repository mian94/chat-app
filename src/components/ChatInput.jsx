//输入文字，发送消息
import React, { useState } from "react";
import { IoMdSend } from "react-icons/io";//用于显示一个“发送”按钮。

export default function ChatInput({ handleSendMsg }) {
  const [msg, setMsg] = useState("");//保存当前输入框中的内容

  const sendChat = (event) => {
    event.preventDefault();
    if (msg.trim().length > 0) {//判断输入内容是否非空（去掉前后空格）
      handleSendMsg(msg);
      setMsg(""); // 清空输入框
    }
  };

  return (
    <>
      <form className="input-container" onSubmit={sendChat}>
        <input
          type="text"
          placeholder="Type your message here"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button type="submit">
          <IoMdSend />
        </button>
      </form>
    </>
  );
}