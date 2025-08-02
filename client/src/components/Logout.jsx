import React from "react";
import { useNavigate } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import styled from "styled-components";
import axios from "axios";
import { logoutRoute } from "../utils/APIRoutes";

export default function Logout() {
  const navigate = useNavigate();
  const handleClick = async () => {
    try {
        const user = localStorage.getItem('chat-app-user');
        if (!user) {
            console.error("No user found in local storage.");
            navigate("/login");
            return;
        }
        const id = JSON.parse(user)._id;

        // 发起 GET 请求
        const response = await axios.get(`${logoutRoute}/${id}`);
        if (response.status === 200) {
        localStorage.clear();
        navigate("/login");
        }
    } catch (error) {
        console.error("There was an error logging out!", error);
    }
  };
  return (
    <Button onClick={handleClick}>
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
