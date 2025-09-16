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
  const senderId = (msg.sender?._id || msg.sender || "").toString();
  const receiverId = (msg.receiver?._id || msg.receiver || "").toString();
  const currentSelectedUser = (selectedUser || "").toString();
  const myId = (user._id || "").toString();

  if (
    (senderId === currentSelectedUser && receiverId === myId) ||
    (senderId === myId && receiverId === currentSelectedUser)
  ) {
    const normalizedMsg = {
      ...msg,
      sender: senderId,
      receiver: receiverId,
      message: msg.message || msg.text || "",
      // normalize file URL properly
      file: msg.file?.url || msg.file?.path || msg.file || null,
    };

    setMessages((prev) => [...prev, normalizedMsg]);
  }
});



    return () => s.disconnect();
  }
}, [user, selectedUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let res = await API.get("/auth/users", { withCredentials: true });

        if (res.status === 401) {
          const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
          if (refreshRes.ok || refreshRes.status === 200) {
            res = await API.get("/auth/users", { withCredentials: true });
          } else {
            return; 
          }
        }

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
      let res = await API.get(`/messages/${otherUserId}`, { withCredentials: true });

      if (res.status === 401) {
        const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
        if (refreshRes.ok || refreshRes.status === 200) {
          res = await API.get(`/messages/${otherUserId}`, { withCredentials: true });
        } else {
          console.error("Failed to refresh token");
          return;
        }
      }

      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async (text) => {
  if (!selectedUser) return;
  try {
    let res = await API.post(
      "/messages/send",
      { receiver: selectedUser, message: text },
      { withCredentials: true } // send cookies
    );

    if (res.status === 401) {
      // access token expired → refresh
      const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
      if (refreshRes.ok || refreshRes.status === 200) {
        res = await API.post(
          "/messages/send",
          { receiver: selectedUser, message: text },
          { withCredentials: true }
        );
      } else {
        console.error("Failed to refresh token");
        return;
      }
    }

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
    let res = await API.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true, // send cookies
    });

    if (res.status === 401) {
      // access token expired → refresh
      const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
      if (refreshRes.ok || refreshRes.status === 200) {
        res = await API.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      } else {
        console.error("Failed to refresh token");
        return;
      }
    }

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
