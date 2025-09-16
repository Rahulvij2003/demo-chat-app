import { createContext, useState, useEffect, useContext } from "react";
import API from "../axios"; 
import { AuthContext } from "./AuthContext";
import { io } from "socket.io-client";

export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const { user } = useContext(AuthContext); 
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupMessages, setGroupMessages] = useState({});
  const [socket, setSocket] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
  useEffect(() => {
  if (!user) return;
  const s = io("http://localhost:5000", { withCredentials: true, query: { userId: user._id } });
  setSocket(s);
  s.on("receiveMessage", (msg) => {
    setGroupMessages((prev) => ({
      ...prev,
      [msg.group]: [...(prev[msg.group] || []), msg],
    }));
  });
  return () => s.disconnect();
}, [user]);

    const handleRequestWithRefresh = async (apiCall) => {
  try {
    return await apiCall();
  } catch (err) {
    if (err.response?.status === 401) {
      try {
        const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });
        if (refreshRes.status === 200) {
          return await apiCall();
        } else {
          window.location.href = "/login";
          return;
        }
      } catch (refreshErr) {
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
    const res = await handleRequestWithRefresh(() => API.get("/groups/my-groups", { withCredentials: true }));
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

  const createGroup = async (name, members) => {
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


  const addMember = async (groupId, memberId) => {
    const apiCall = () => API.post(`/groups/${groupId}/add-member`, { memberId }, { withCredentials: true });

    try {
        const res = await handleRequestWithRefresh(apiCall);
        if (res) {
        setGroups((prev) =>
            prev.map((g) => (g._id === groupId ? res.data.group : g))
        );
        return res.data;
        }
    } catch (err) {
        console.error("Error adding member:", err);
        throw err;
    }
    };


  const assignAdmin = async (groupId, memberId) => {
    const res = await handleRequestWithRefresh(() =>
        API.post(`/groups/${groupId}/assign-admin`, { memberId }, { withCredentials: true })
    );

    if (res) {
        setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? res.data.group : g))
        );
        return res.data;
    }
    };


const sendGroupMessage = async (groupId, formData) => {
  const handleRequest = () =>
    API.post(`/groups/${groupId}/send`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

  try {
    const res = await handleRequestWithRefresh(handleRequest);

    if (!res) return; // redirected to /login if refresh failed

    setGroupMessages((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), res.data],
    }));

    return res.data;
  } catch (err) {
    console.error("Error sending group message:", err);
    throw err;
  }
};



  const getGroupMessages = async (groupId) => {
  const res = await handleRequestWithRefresh(() => API.get(`/groups/${groupId}/messages`, { withCredentials: true }));
  if (res) {
    setGroupMessages((prev) => ({ ...prev, [groupId]: res.data }));
    return res.data;
  }
};



  const removeMember = async (groupId, memberId) => {
    const apiCall = () => API.delete(`/groups/${groupId}/remove-member/${memberId}`, { withCredentials: true });

    try {
        const res = await handleRequestWithRefresh(apiCall);
        if (res) {
        setGroups((prev) =>
            prev.map((g) => (g._id === groupId ? res.data.group : g))
        );
        return res.data;
        }
    } catch (err) {
        console.error("Error removing member:", err);
        throw err;
    }
    };

const removeAdmin = async (groupId, adminId) => {
  const handleRequest = () => API.delete(`/groups/${groupId}/remove-admin/${adminId}`, { withCredentials: true });

  try {
    const res = await handleRequestWithRefresh(handleRequest);
    if (res) {
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? res.data.group : g))
      );
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
        removeAdmin
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
