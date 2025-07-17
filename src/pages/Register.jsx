import React, { useState, useEffect } from "react";
import axios from "axios";
import { registerRoute } from "../utils/APIRoutes";
import { useNavigate} from "react-router-dom";

function Register() {
    const navigate = useNavigate();
    const [values, setValues] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleValidation = () => {
      const { password, confirmPassword, username, email } = values;
      if (password !== confirmPassword) {
        return false;
      } else if (email === "") {
        return false;
      }
      return true;
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      if (handleValidation()) {
        const { email, username, password } = values;
        const { data } = await axios.post(registerRoute, {
          username,
          email,
          password,
        });

        if (data.status === false) {
          alert("注册失败");
        }
        if (data.status === true) {
          localStorage.setItem(
            'chat-app-user',
            JSON.stringify(data.user)
          );
          navigate("/");
        }
      }
    };

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
    };

    return (
    <>
        <form action="" onSubmit={(event) => handleSubmit(event)}>
          <div className="brand">
            <h1>注册</h1>
          </div>
          <input
            type="text"
            placeholder="Username"
            name="username"
            onChange={(e) => handleChange(e)}
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            onChange={(e) => handleChange(e)}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            onChange={(e) => handleChange(e)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            name="confirmPassword"
            onChange={(e) => handleChange(e)}
          />
          <button type="submit">Create User</button>
        </form>
    </>
    );
}

export default Register;