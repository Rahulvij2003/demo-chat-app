import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import API from "../services/api";

// Types
interface User {
  _id: string;
  username?: string;
  email?: string;
}

interface Message {
  sender: string;
  message: string;
}

interface ChatProps {
  user: User | null;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [receiverId, setReceiverId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      const newSocket: Socket = io("http://localhost:5000", { withCredentials: true });
      setSocket(newSocket);

      newSocket.emit("join", user._id);

      newSocket.on("receiveMessage", (data: { senderId: string; message: string }) => {
        setMessages((prev) => [...prev, { sender: data.senderId, message: data.message }]);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendMessage = async () => {
    if (!message || !receiverId || !socket || !user) return;

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
          <p key={i}>
            <b>{m.sender}:</b> {m.message}
          </p>
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
