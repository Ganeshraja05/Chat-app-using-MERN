import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:4000");

function App() {
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentChat, setCurrentChat] = useState("public");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState({});
    const [typingUser, setTypingUser] = useState("");

    useEffect(() => {
        socket.on("user_list", (userList) => setUsers(userList));

        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        socket.on("user_typing", ({ username, isTyping }) => {
            setTypingUser(isTyping ? username : "");
        });

        return () => {
            socket.off("user_list");
            socket.off("receive_message");
            socket.off("user_typing");
        };
    }, []);

    const joinChat = () => {
        if (username.trim() && avatar) {
            socket.emit("join_chat", { username, avatar });
            setIsLoggedIn(true);
        }
    };

    const sendMessage = () => {
        if (message.trim()) {
            const timestamp = new Date().toLocaleTimeString();
            socket.emit("send_message", { to: currentChat, message, from: username, avatar, timestamp });
            setMessage("");
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);
        socket.emit("typing", { isTyping: e.target.value.trim() !== "", to: currentChat });
    };

    const selectChat = (id) => {
        setCurrentChat(id);
        setMessages([]);
    };

    return (
        <div className="App">
           {!isLoggedIn ? (
    <div className="login-container">
        <h2>Join the Chat</h2>
        <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <input
            type="text"
            placeholder="Enter avatar URL"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
        />
        <button onClick={joinChat}>Start Chatting</button>
    </div>
) :
 (
                <div className="chat-layout">
                    <div className="sidebar">
                        <h3>Chats</h3>
                        <div className="user-list">
                            <div
                                className={`user ${currentChat === "public" ? "active" : ""}`}
                                onClick={() => selectChat("public")}
                            >
                                Public Chat
                            </div>
                            {Object.entries(users).map(([id, user]) => (
                                <div
                                    key={id}
                                    className={`user ${currentChat === id ? "active" : ""}`}
                                    onClick={() => selectChat(id)}
                                >
                                    <img src={user.avatar} alt={user.username} className="avatar" />
                                    {user.username} {user.online ? "🟢" : "🔴"}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="chat-container">
                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.from === username ? "own" : ""}`}>
                                    <img src={msg.avatar} alt={msg.from} className="avatar" />
                                    <div>
                                        <strong>{msg.from}</strong>: {msg.message}
                                    </div>
                                    <span className="timestamp">{msg.timestamp}</span>
                                </div>
                            ))}
                            {typingUser && <div className="typing">{typingUser} is typing...</div>}
                        </div>
                        <div className="input-container">
                            <input
                                type="text"
                                value={message}
                                onChange={handleTyping}
                                placeholder="Type a message"
                            />
                            <button onClick={sendMessage}>Send</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
