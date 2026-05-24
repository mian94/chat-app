import React, { useRef, useState } from "react";
import { IoMdSend } from "react-icons/io";
import styled from "styled-components";
import { uploadRoute } from "../utils/APIRoutes";
import apiClient, { getErrorMessage } from "../utils/apiClient";
import { MAX_UPLOAD_SIZE_BYTES } from "../constants/app";

export default function ChatInput({ handleSendMsg }) {
  const fileInputRef = useRef(null); //引用隐藏的文件输入框，用来手动清空文件输入框的值
  const [msg, setMsg] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false); //是否正在发送消息

  //选择文件函数
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setErrorMessage("文件不能超过 10MB。");
      setFile(null);
      setFileType(null);
      setFileName("");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setFile(selectedFile);
    setFileName(selectedFile.name);

    if (selectedFile.type.startsWith("image/")) {
      setFileType("image");
      return;
    }

    if (selectedFile.type.startsWith("video/")) {
      setFileType("video");
      return;
    }

    setFileType("file");
  };

  const uploadFile = async (nextFile) => {
    const formData = new FormData();
    formData.append("file", nextFile);

    const response = await apiClient.post(uploadRoute, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "文件上传失败");
    }

    return response.data;
  };

  const resetForm = () => {
    setMsg("");
    setFile(null);
    setFileType(null);
    setFileName("");
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendChat = async (event) => {
    event.preventDefault();
    if (isSending) {
      return;
    }

    const trimmedText = msg.trim();
    if (!trimmedText && !file) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage("");

      let messageData = {
        text: trimmedText,
        mediaUrl: null,
        mediaType: null,
        fileName: null,
      };

      if (file) {
        const uploadResult = await uploadFile(file);
        messageData = {
          text: trimmedText,
          mediaUrl: uploadResult.url,
          mediaType: uploadResult.type,
          fileName: uploadResult.filename,
        };
      }

      await handleSendMsg(messageData);
      resetForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "消息发送失败，请稍后重试。"));
    } finally {
      setIsSending(false);
    }
  };

  const selectedFileDescription = fileName
    ? `已选择${fileType === "image" ? "图片" : fileType === "video" ? "视频" : "文件"}：${fileName}`
    : "";

  return (
    <Container>
      <form className="input-container" onSubmit={sendChat}>
        <input
          type="text"
          placeholder="输入消息"
          value={msg}
          onChange={(event) => setMsg(event.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          id="fileInput"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <label htmlFor="fileInput">添加文件</label>
        <button type="submit" disabled={isSending}>
          <IoMdSend />
        </button>
      </form>
      {(selectedFileDescription || errorMessage) && (
        <div className={`input-meta ${errorMessage ? "error" : ""}`}>
          {errorMessage || selectedFileDescription}
        </div>
      )}
    </Container>
  );
}

const Container = styled.div`
  background-color: #080420;
  padding: 0.5rem 2rem 0.75rem;

  @media screen and (min-width: 720px) and (max-width: 1080px) {
    padding: 0.5rem 1rem 0.75rem;
  }

  .input-container {
    width: 100%;
    border-radius: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    background-color: #ffffff34;
    padding: 0.35rem 0.75rem;

    input[type="text"] {
      width: 100%;
      height: 60%;
      background-color: transparent;
      color: white;
      border: none;
      padding-left: 1rem;
      font-size: 1.05rem;

      &::selection {
        background-color: #9a86f3;
      }

      &:focus {
        outline: none;
      }
    }

    label {
      padding: 0.45rem 1rem;
      border-radius: 2rem;
      background-color: #9a86f3;
      color: white;
      cursor: pointer;
      white-space: nowrap;
      font-size: 0.9rem;
    }

    button {
      padding: 0.45rem 1.4rem;
      border-radius: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #9a86f3;
      border: none;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      svg {
        font-size: 1.5rem;
        color: white;
      }
    }
  }

  .input-meta {
    margin-top: 0.5rem;
    padding-left: 1rem;
    font-size: 0.9rem;
    color: #d5d2ff;
  }

  .input-meta.error {
    color: #ff9eb4;
  }
`;
