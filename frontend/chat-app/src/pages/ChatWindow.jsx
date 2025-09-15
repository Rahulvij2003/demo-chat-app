import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const ChatWindow = () => {
  const { messages, sendMessage, selectedUser, users, sendFile } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [text, setText] = useState("");
    const [file, setFile] = useState(null);
  if (!selectedUser) {
    return <div style={{ flex: 1, padding: "20px" }}>Select a user to chat</div>;
  }

  const currentUser = users.find((u) => u._id === selectedUser);

  const handleSend = async () => {
        if (text.trim()) {
            await sendMessage(text);
            setText("");
        }

        if (file) {
            await sendFile(file);
            setFile(null);
        }
    };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ddd",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#4a90e2",
          color: "white",
          padding: "12px 16px",
          fontWeight: "bold",
          fontSize: "16px",
        }}
      >
        Chat with {currentUser?.username}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "15px",
          backgroundColor: "#f4f6f9",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((m) => {
  const isOwn = m.sender === user._id || m.sender?._id === user._id;
  return (
    <div
      key={m._id}
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <div
  style={{
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "18px",
    backgroundColor: isOwn ? "#4a90e2" : "#e5e5ea",
    color: isOwn ? "white" : "black",
    textAlign: "left",
    wordBreak: "break-word",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  }}
>
  {m.message || m.text}
  {m.file && (
    <div style={{ marginTop: "5px" }}>
      <a
        href={m.file}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: isOwn ? "#fff" : "#0000EE", textDecoration: "underline" }}
      >
        {m.file.split("/").pop()}
      </a>
    </div>
  )}
</div>
    </div>
  );
})}

      </div>
      <div
        style={{
          display: "flex",
          padding: "10px",
          borderTop: "1px solid #ddd",
          backgroundColor: "#fff",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            outline: "none",
            marginRight: "8px",
          }}
        />
        <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])} 
            style={{ marginRight: "10px" }}
            />

        <button
          onClick={handleSend}
          style={{
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "20px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
