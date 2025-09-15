import { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import API from "../axios";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
    const [file, setFile] = useState(null);
  useEffect(() => {
  if (user) {
    const s = io("http://localhost:5000", {
      withCredentials: true,
      query: { userId: user._id }, 
    });
    setSocket(s);
    s.emit("join", user._id);
    s.on("receiveMessage", (msg) => {
        const senderId = msg.sender?._id || msg.sender;
        const receiverId = msg.receiver?._id || msg.receiver;

        if (
            (senderId === selectedUser && receiverId === user._id) ||
            (senderId === user._id && receiverId === selectedUser)
        ) {
            setMessages((prev) => [...prev, msg]);
        }
    });

    return () => s.disconnect();
  }
}, [user, selectedUser]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/auth/users");
        setUsers(res.data.filter((u) => u._id !== user?._id));
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchUsers();
  }, [user]);

  const fetchMessages = async (otherUserId) => {
    setSelectedUser(otherUserId);
    try {
      const res = await API.get(`/messages/${otherUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async (text) => {
    if (!selectedUser) return;
    try {
        const res = await API.post("/messages/send", {
        receiver: selectedUser,
        message: text,
        });

        const savedMsg = {
        ...res.data,
        sender: res.data.sender?._id || res.data.sender,
        receiver: res.data.receiver?._id || res.data.receiver,
        };

        setMessages((prev) => [...prev, savedMsg]);

        socket.emit("sendMessage", {
        sender: savedMsg.sender,
        receiver: savedMsg.receiver,
        message: savedMsg.message,
        });
    } catch (err) {
        console.error("Error sending message:", err);
    }
    };

    const sendFile = async (file) => {
  if (!selectedUser) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("receiver", selectedUser);

  try {
    const res = await API.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const savedMsg = {
      ...res.data,
      sender: res.data.sender?._id || res.data.sender,
      receiver: res.data.receiver?._id || res.data.receiver,
    };
    setMessages((prev) => [...prev, savedMsg]);
    socket.emit("sendMessage", savedMsg);

  } catch (err) {
    console.error("Error sending file:", err);
  }
};




  return (
    <ChatContext.Provider
      value={{
        users,
        selectedUser,
        setSelectedUser,
        messages,
        fetchMessages,
        sendMessage,
        sendFile
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
