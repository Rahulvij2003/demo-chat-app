import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import API from "../axios";
import { AuthContext } from "./AuthContext";
import { io, Socket } from "socket.io-client";

// Types
interface User {
  _id: string;
  [key: string]: any;
}

interface Group {
  _id: string;
  name: string;
  members: User[];
  [key: string]: any;
}

interface Message {
  _id?: string;
  group: string;
  sender?: string;
  text?: string;
  fileUrl?: string;
  createdAt?: string;
  [key: string]: any;
}

interface GroupContextType {
  groups: Group[];
  loading: boolean;
  groupMessages: Record<string, Message[]>;
  fetchGroups: () => Promise<void>;
  selectedGroup: Group | null;
  setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>>;
  createGroup: (name: string, members: string[]) => Promise<any>;
  addMember: (groupId: string, memberId: string) => Promise<any>;
  assignAdmin: (groupId: string, memberId: string) => Promise<any>;
  sendGroupMessage: (groupId: string, formData: FormData) => Promise<any>;
  getGroupMessages: (groupId: string) => Promise<any>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  removeMember: (groupId: string, memberId: string) => Promise<any>;
  removeAdmin: (groupId: string, adminId: string) => Promise<any>;
}

export const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useContext<any>(AuthContext);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMessages, setGroupMessages] = useState<Record<string, Message[]>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
  if (!user) return;

  const s: Socket = io("http://localhost:5000", {
    withCredentials: true,
    query: { userId: user._id },
  });

  setSocket(s);

  // One-on-one messages
  s.on("receiveMessage", (msg: any) => {
    const normalizedMsg: Message = {
      ...msg,
      sender: msg.sender?._id || msg.sender,
      group: msg.group,
      text: msg.text || msg.message || "",
      fileUrl: msg.file?.url || msg.fileUrl || null,
    };

    setGroupMessages((prev) => ({
      ...prev,
      [normalizedMsg.group]: [...(prev[normalizedMsg.group] || []), normalizedMsg],
    }));
  });

  // Group messages
  s.on("receiveGroupMessage", (msg: any) => {
    const normalizedMsg: Message = {
      ...msg,
      group: msg.group,
      sender: msg.sender,
      text: msg.text,
      fileUrl: msg.fileUrl || null,
      createdAt: msg.createdAt,
    };

    setGroupMessages((prev) => ({
      ...prev,
      [msg.group]: [...(prev[msg.group] || []), normalizedMsg],
    }));
  });

  return () => {
    s.disconnect();
  };
}, [user]);
useEffect(() => {
  if (selectedGroup && socket) {
    if (socket.connected) {
      socket.emit("joinGroup", selectedGroup._id);
    } else {
      socket.on("connect", () => {
        socket.emit("joinGroup", selectedGroup._id);
      });
    }
  }
}, [selectedGroup, socket]);


  const handleRequestWithRefresh = async (apiCall: () => Promise<any>) => {
    try {
      return await apiCall();
    } catch (err: any) {
      if (err.response?.status === 401) {
        try {
          const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
          if (refreshRes.status === 200) {
            return await apiCall();
          } else {
            window.location.href = "/login";
            return;
          }
        } catch {
          window.location.href = "/login";
          return;
        }
      } else {
        throw err;
      }
    }
  };

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await handleRequestWithRefresh(() =>
        API.get("/groups/my-groups", { withCredentials: true })
      );
      if (res) setGroups(res.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const createGroup = async (name: string, members: string[]) => {
    try {
      const res = await handleRequestWithRefresh(() =>
        API.post("/groups/create", { name, members }, { withCredentials: true })
      );
      if (res) {
        setGroups((prev) => [...prev, res.data.group]);
        return res.data;
      }
    } catch (err) {
      console.error("Error creating group:", err);
      throw err;
    }
  };

  const addMember = async (groupId: string, memberId: string) => {
    const apiCall = () =>
      API.post(`/groups/${groupId}/add-member`, { memberId }, { withCredentials: true });
    try {
      const res = await handleRequestWithRefresh(apiCall);
      if (res) {
        setGroups((prev) => prev.map((g) => (g._id === groupId ? res.data.group : g)));
        return res.data;
      }
    } catch (err) {
      console.error("Error adding member:", err);
      throw err;
    }
  };

  const assignAdmin = async (groupId: string, memberId: string) => {
    const res = await handleRequestWithRefresh(() =>
      API.post(`/groups/${groupId}/assign-admin`, { memberId }, { withCredentials: true })
    );
    if (res) {
      setGroups((prev) => prev.map((g) => (g._id === groupId ? res.data.group : g)));
      return res.data;
    }
  };

  const sendGroupMessage = async (groupId: string, formData: FormData) => {
  try {
    const res = await handleRequestWithRefresh(() =>
      API.post(`/groups/${groupId}/send`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      })
    );
    if (!res) return;

    // Update local state
    setGroupMessages((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), res.data],
    }));

    // Emit to socket
    if (socket) {
      socket.emit("sendGroupMessage", {
        groupId, // use parameter, not selectedGroup
        sender: user._id,
        text: formData.get("message"),
        fileUrl: null,
      });
    }

    return res.data;
  } catch (err) {
    console.error("Error sending group message:", err);
    throw err;
  }
};


  const getGroupMessages = async (groupId: string) => {
    const res = await handleRequestWithRefresh(() =>
      API.get(`/groups/${groupId}/messages`, { withCredentials: true })
    );
    if (res) {
      setGroupMessages((prev) => ({ ...prev, [groupId]: res.data }));
      return res.data;
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    const apiCall = () =>
      API.delete(`/groups/${groupId}/remove-member/${memberId}`, { withCredentials: true });
    try {
      const res = await handleRequestWithRefresh(apiCall);
      if (res) {
        setGroups((prev) => prev.map((g) => (g._id === groupId ? res.data.group : g)));
        return res.data;
      }
    } catch (err) {
      console.error("Error removing member:", err);
      throw err;
    }
  };

  const removeAdmin = async (groupId: string, adminId: string) => {
    const handleRequest = () =>
      API.delete(`/groups/${groupId}/remove-admin/${adminId}`, { withCredentials: true });
    try {
      const res = await handleRequestWithRefresh(handleRequest);
      if (res) {
        setGroups((prev) => prev.map((g) => (g._id === groupId ? res.data.group : g)));
        return res.data;
      }
    } catch (err) {
      console.error("Error removing admin:", err);
      throw err;
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        loading,
        groupMessages,
        fetchGroups,
        selectedGroup,
        setSelectedGroup,
        createGroup,
        addMember,
        assignAdmin,
        sendGroupMessage,
        getGroupMessages,
        setGroups,
        removeMember,
        removeAdmin,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
