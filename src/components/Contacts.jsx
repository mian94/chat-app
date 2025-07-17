//用于展示用户的联系人列表，并允许用户选择一个联系人进行聊天。
import React, { useState, useEffect } from "react";

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
          <div className="brand">
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
        </>
  );
}