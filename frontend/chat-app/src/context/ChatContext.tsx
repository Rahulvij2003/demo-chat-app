import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import API from "../axios";
import { AuthContext } from "./AuthContext";

// ---- Types ----
interface User {
  _id: string;
  username?: string;
  email?: string;
}

interface Message {
  sender: string;
  receiver: string;
  message?: string;
  file?: string | null;
  [key: string]: any; // allow extra fields from backend
}

interface ChatContextType {
  users: User[];
  selectedUser: string | null;
  setSelectedUser: (id: string | null) => void;
  messages: Message[];
  fetchMessages: (otherUserId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendFile: (file: File) => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext<any>(AuthContext); // fallback any since AuthContext user type may vary
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // ---- Setup socket ----
  useEffect(() => {
    if (user) {
      const s: Socket = io("http://localhost:5000", {
        withCredentials: true,
        query: { userId: user._id },
      });
      setSocket(s);
      s.emit("join", user._id);

      s.on("receiveMessage", (msg: any) => {
        const senderId = (msg.sender?._id || msg.sender || "").toString();
        const receiverId = (msg.receiver?._id || msg.receiver || "").toString();
        const currentSelectedUser = (selectedUser || "").toString();
        const myId = (user._id || "").toString();

        if (
          (senderId === currentSelectedUser && receiverId === myId) ||
          (senderId === myId && receiverId === currentSelectedUser)
        ) {
          const normalizedMsg: Message = {
            ...msg,
            sender: senderId,
            receiver: receiverId,
            message: msg.message || msg.text || "",
            file: msg.file?.url || msg.file?.path || msg.file || null,
          };

          setMessages((prev) => [...prev, normalizedMsg]);
        }
      });

      return () => {
        s.disconnect();
      };
    }
  }, [user, selectedUser]);

  // ---- Fetch users ----
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let res = await API.get("/auth/users", { withCredentials: true });

        if (res.status === 401) {
          const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
          if (refreshRes.status === 200) {
            res = await API.get("/auth/users", { withCredentials: true });
          } else {
            return;
          }
        }

        setUsers(res.data.filter((u: User) => u._id !== user?._id));
      } catch (err) {
        console.error(err);
      }
    };

    if (user) fetchUsers();
  }, [user]);

  // ---- Fetch messages ----
  const fetchMessages = async (otherUserId: string) => {
    setSelectedUser(otherUserId);
    try {
      let res = await API.get(`/messages/${otherUserId}`, { withCredentials: true });

      if (res.status === 401) {
        const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
        if (refreshRes.status === 200) {
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

  // ---- Send message ----
  const sendMessage = async (text: string) => {
    if (!selectedUser) return;
    try {
      let res = await API.post(
        "/messages/send",
        { receiver: selectedUser, message: text },
        { withCredentials: true }
      );

      if (res.status === 401) {
        const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
        if (refreshRes.status === 200) {
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

      const savedMsg: Message = {
        ...res.data,
        sender: res.data.sender?._id || res.data.sender,
        receiver: res.data.receiver?._id || res.data.receiver,
      };

      setMessages((prev) => [...prev, savedMsg]);
      socket?.emit("sendMessage", {
        sender: savedMsg.sender,
        receiver: savedMsg.receiver,
        message: savedMsg.message,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // ---- Send file ----
  const sendFile = async (file: File) => {
    if (!selectedUser) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiver", selectedUser);

    try {
      let res = await API.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.status === 401) {
        const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
        if (refreshRes.status === 200) {
          res = await API.post("/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });
        } else {
          console.error("Failed to refresh token");
          return;
        }
      }

      const savedMsg: Message = {
        ...res.data,
        sender: res.data.sender?._id || res.data.sender,
        receiver: res.data.receiver?._id || res.data.receiver,
      };
      setMessages((prev) => [...prev, savedMsg]);
      socket?.emit("sendMessage", savedMsg);
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
        sendFile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
