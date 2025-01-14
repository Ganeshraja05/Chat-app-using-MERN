const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

let users = {};

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins with a username and avatar
    socket.on("join_chat", ({ username, avatar }) => {
        users[socket.id] = { username, avatar, online: true, lastSeen: new Date().toISOString() };
        io.emit("user_list", users); // Broadcast updated user list
    });

    // Handle sending messages
    socket.on("send_message", ({ to, message, from, avatar, timestamp }) => {
        const payload = { id: socket.id, to, message, from, avatar, timestamp };
        if (to === "public") {
            io.emit("receive_message", payload);
        } else {
            socket.to(to).emit("receive_message", payload); // Private message
        }
    });

    // Typing indicator
    socket.on("typing", ({ isTyping, to }) => {
        if (to === "public") {
            socket.broadcast.emit("user_typing", { username: users[socket.id].username, isTyping });
        } else {
            socket.to(to).emit("user_typing", { username: users[socket.id].username, isTyping });
        }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        if (users[socket.id]) {
            users[socket.id].online = false;
            users[socket.id].lastSeen = new Date().toISOString();
        }
        io.emit("user_list", users);
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
