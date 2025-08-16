//用于展示用户的联系人列表，并允许用户选择一个联系人进行聊天。
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import logo from "../assets/logo.svg";

//contacts（联系人列表）和 changeChat（切换当前聊天对象的回调函数）
export default function Contacts({ contacts, changeChat }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);//当前登录用户的用户名
  const [currentSelected, setCurrentSelected] = useState(undefined);// 当前选中的联系人索引，用于高亮显示选中的联系人

  //获取当前用户名
  useEffect(() => {
    const fetchUserName = async () => {
      const data = await JSON.parse(localStorage.getItem('chat-app-user'));
      setCurrentUserName(data.username);
    };
    fetchUserName();
  }, []);

  //参数（联系人的索引，联系人对象）
  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };
  return (
      <>
        <Container>
          <div className="brand">
            <img src={logo} alt="logo" />
            <h3>chat</h3>
          </div>
          <div className="contacts">
            {contacts.map((contact, index) => {
              return (
                <div
                  key={contact._id}
                  //如果当前联系人项被选中（即其索引等于 currentSelected），则添加 "selected" 类名来改变样式。
                  className={`contact ${
                    index === currentSelected ? "selected" : ""
                  }`}
                  onClick={() => changeCurrentChat(index, contact)}
                >
                  <div className="username">
                    <h3>{contact.username}</h3>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="current-user">
            <div className="username">
              <h2>{currentUserName}</h2>
            </div>
          </div>
        </Container>
      </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
    .selected {
      background-color: #9a86f3;
    }
  }

  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;