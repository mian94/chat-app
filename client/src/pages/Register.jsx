import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import logo from "../assets/logo.svg";
import { registerRoute } from "../utils/APIRoutes";
import apiClient, { getErrorMessage } from "../utils/apiClient";
import { CHAT_USER_STORAGE_KEY } from "../constants/app";

function Register() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidation = () => {
    const { password, confirmPassword, username, email } = values;

    if (!username.trim()) {
      setErrorMessage("请输入用户名");
      return false;
    }

    if (!email.trim()) {
      setErrorMessage("邮箱不能为空");
      return false;
    }

    if (password.length < 8) {
      setErrorMessage("密码至少需要 8 位");
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage("两次输入的密码不一致");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!handleValidation()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const { email, username, password } = values;
      const { data } = await apiClient.post(registerRoute, {
        username,
        email,
        password,
      });

      if (!data.status) {
        setErrorMessage(data.msg || "注册失败");
        return;
      }

      localStorage.setItem(CHAT_USER_STORAGE_KEY, JSON.stringify(data.user));
      navigate("/");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "注册失败，请稍后重试。"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <div className="brand">
          <img src={logo} alt="logo" />
          <h1>注册</h1>
        </div>
        <input
          type="text"
          placeholder="Username"
          name="username"
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Password"
          name="password"
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          name="confirmPassword"
          onChange={handleChange}
        />
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "提交中..." : "Create User"}
        </button>
        <span>
          Already have an account ? <Link to="/login">Login.</Link>
        </span>
      </form>
    </FormContainer>
  );
}

const FormContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;

    img {
      height: 5rem;
    }

    h1 {
      color: white;
      text-transform: uppercase;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background-color: #00000076;
    border-radius: 2rem;
    padding: 3rem 5rem;
    min-width: 22rem;
  }

  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid #4e0eff;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    font-size: 1rem;

    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }
  }

  .error-message {
    color: #ff9eb4;
    font-size: 0.95rem;
  }

  button {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  span {
    color: white;

    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
    }
  }
`;

export default Register;
