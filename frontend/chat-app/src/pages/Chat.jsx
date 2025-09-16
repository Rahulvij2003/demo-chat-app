import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

const Chat = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [receiverId, setReceiverId] = useState("");
    const [file, setFile] = useState(null);
  useEffect(() => {
    if (user) {
      const newSocket = io("http://localhost:5000", { withCredentials: true });
      setSocket(newSocket);

      newSocket.emit("join", user._id);

      newSocket.on("receiveMessage", (data) => {
        setMessages((prev) => [...prev, { sender: data.senderId, message: data.message }]);
      });

      return () => newSocket.close();
    }
  }, [user]);

  const sendMessage = async () => {
    if (!message || !receiverId) return;

    try {
      const res = await API.post("/messages/send", {
        receiver: receiverId,
        message,
      });
      setMessages((prev) => [...prev, res.data]);

      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId,
        message,
      });

      setMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <input
        placeholder="Receiver User ID"
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
      />
      <div style={{ border: "1px solid black", height: "200px", overflowY: "scroll" }}>
        {messages.map((m, i) => (
          <p key={i}><b>{m.sender}:</b> {m.message}</p>
        ))}
      </div>
      <input
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
