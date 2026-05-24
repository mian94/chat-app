import React, { useState } from "react";
import styled from "styled-components";
import logo from "../assets/logo.svg";
import useDebouncedValue from "../hooks/useDebouncedValue";

export default function Contacts({ contacts, changeChat, currentUser }) {
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const filteredContacts = contacts.filter((contact) =>
    contact.username.toLowerCase().includes(debouncedKeyword.trim().toLowerCase())
  );

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  return (
    <Container>
      <div className="brand">
        <img src={logo} alt="logo" />
        <h3>chat</h3>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="搜索联系人"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <div className="contacts">
        {filteredContacts.length === 0 ? (
          <div className="empty-state">没有匹配的联系人</div>
        ) : (
          filteredContacts.map((contact, index) => (
            <div
              key={contact._id}
              className={`contact ${index === currentSelected ? "selected" : ""}`}
              onClick={() => changeCurrentChat(index, contact)}
            >
              <div className="username">
                <h3>{contact.username}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="current-user">
        <div className="username">
          <h2>{currentUser?.username || "未登录"}</h2>
        </div>
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 12% 63% 15%;
  overflow: hidden;
  background-color: #080420;

  @media screen and (max-width: 719px) {
    grid-template-rows: 14% 12% 59% 15%;
  }

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

  .search-box {
    padding: 0 1rem;
    display: flex;
    align-items: center;

    input {
      width: 100%;
      border: 1px solid #3f316d;
      border-radius: 0.75rem;
      background-color: #120a2b;
      color: white;
      padding: 0.75rem 1rem;
      outline: none;
    }
  }

  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    padding-bottom: 0.75rem;

    &::-webkit-scrollbar {
      width: 0.2rem;

      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }

    .contact,
    .empty-state {
      background-color: #ffffff34;
      min-height: 4.5rem;
      width: 90%;
      border-radius: 0.5rem;
      padding: 0.4rem 1rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .contact {
      cursor: pointer;
      transition: 0.2s ease-in-out;
    }

    .empty-state {
      justify-content: center;
      color: #d9d4ff;
      font-size: 0.95rem;
    }

    .username {
      h3 {
        color: white;
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

    .username {
      h2 {
        color: white;
      }
    }
  }
`;
