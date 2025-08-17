//输入文字，发送消息
import React, { useState } from "react";
import { IoMdSend } from "react-icons/io";//用于显示一个“发送”按钮。
import styled from "styled-components";
import axios from "axios";

export default function ChatInput({ handleSendMsg }) {
  const [msg, setMsg] = useState("");//保存当前输入框中的内容
  const [file, setFile]  = useState(null);//保存选中的文件
  const [fileUrl, setFileUrl] = useState(""); // 本地预览 URL
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState("");

  // 文件选择处理
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
      setFile(selectedFile);
      setFileName(selectedFile.name);
      if(selectedFile.type.startsWith("image")) setFileType("image");
      else if(selectedFile.type.startsWith("video")) setFileType("video");
      else setFileType("file");
    }
  };

  // 上传文件到服务器
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file); // 字段名必须是 'file'，和后端一致

    try {
      const response = await axios.post('http://154.9.253.28:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return response.data; // { url, type, filename }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  // 发送消息
  const sendChat = async (event) => {
    event.preventDefault();

    let messageData;
    if (file) {
      // 如果有文件，先上传文件
      try {
        const uploadResult = await uploadFile(file);

        messageData = {
          text: msg.trim(),
          mediaUrl: uploadResult.url,
          mediaType: uploadResult.type,
          fileName: uploadResult.filename,
        };
      } catch (uploadError) {
        alert('文件上传失败');
        return;
      }
    } else {
      // 没有文件，只发送文本
      messageData = {
        text: msg.trim(),
        mediaUrl: null,
        mediaType: null,
        fileName: null,
      };
    }

    // 只有文本或有文件时才发送
    if (messageData.text || messageData.mediaUrl) {
      handleSendMsg(messageData);//统一通过 handleSendMsg 发送

      // 清空状态
      setMsg("");
      setFile(null);
      setFileUrl("");
      setFileType(null);
      setFileName("");

      // 重置文件输入（否则下次无法选择同一文件）
      document.getElementById("fileInput").value = "";
    }
  };

  return (
    <Container>
      <form className="input-container" onSubmit={sendChat}>
        <input
          type="text"
          placeholder="Type your message here"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <input
          type="file"
          name="file"
          id="fileInput"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip" 
          style={{ display: 'none' }}//隐藏input
          onChange={handleFileChange}
        />
        <label htmlFor="fileInput">
          Add File
        </label>
        <button type="submit">
          <IoMdSend />
        </button>
      </form>
    </Container>
  );
}

const Container = styled.div`
  background-color: #080420;
  padding: 0 2rem;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0 1rem;
    gap: 1rem;
  }
  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    background-color: #ffffff34;
    input {
      width: 90%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 1.2rem;

      &::selection {
        background-color: #9a86f3;
      }
      &:focus {
        outline: none;
      }
    }
    label {
      padding: 0.1rem 1rem;
      border-radius: 2rem;
      background-color: #9a86f3;
    }
    button {
      padding: 0.3rem 2rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #9a86f3;
      border: none;
      @media screen and (min-width: 720px) and (max-width: 1080px) {
        padding: 0.3rem 1rem;
        svg {
          font-size: 1rem;
        }
      }
      svg {
        font-size: 2rem;
        color: white;
      }
    }
  }
`;