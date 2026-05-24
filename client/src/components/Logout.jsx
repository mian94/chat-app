import React from "react";
import { useNavigate } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import styled from "styled-components";
import apiClient, { getErrorMessage } from "../utils/apiClient";
import { logoutRoute } from "../utils/APIRoutes";
import { CHAT_USER_STORAGE_KEY } from "../constants/app";

export default function Logout() {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      const storedUser = localStorage.getItem(CHAT_USER_STORAGE_KEY);
      if (!storedUser) {
        navigate("/login");
        return;
      }

      const id = JSON.parse(storedUser)._id;
      const response = await apiClient.get(`${logoutRoute}/${id}`);
      if (response.status === 200) {
        localStorage.removeItem(CHAT_USER_STORAGE_KEY);
        navigate("/login");
      }
    } catch (error) {
      window.alert(getErrorMessage(error, "退出登录失败，请稍后重试。"));
    }
  };

  return (
    <Button onClick={handleClick} type="button">
      <BiPowerOff />
    </Button>
  );
}

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #9a86f3;
  border: none;
  cursor: pointer;

  svg {
    font-size: 1.3rem;
    color: #ebe7ff;
  }
`;
