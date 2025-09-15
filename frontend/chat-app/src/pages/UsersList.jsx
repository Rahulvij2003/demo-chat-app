import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";

const UserList = () => {
  const { users, fetchMessages, selectedUser } = useContext(ChatContext);

  return (
    <div
      style={{
        width: "250px",
        borderRight: "1px solid #ddd",
        backgroundColor: "#f9f9f9",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#4a90e2",
          color: "white",
          fontWeight: "bold",
          fontSize: "18px",
          textAlign: "center",
        }}
      >
        Users
      </div>

      {/* User list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => fetchMessages(u._id)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              backgroundColor:
                selectedUser === u._id ? "#e6f0ff" : "transparent",
              fontWeight: selectedUser === u._id ? "bold" : "normal",
              color: selectedUser === u._id ? "#4a90e2" : "#333",
              borderBottom: "1px solid #eee",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (selectedUser !== u._id)
                e.currentTarget.style.backgroundColor = "#f1f1f1";
            }}
            onMouseLeave={(e) => {
              if (selectedUser !== u._id)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {u.username}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
