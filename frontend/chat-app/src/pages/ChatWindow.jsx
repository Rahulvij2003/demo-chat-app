import { useContext, useState, useRef, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
import { GroupContext } from "../context/GroupContext";
import { AuthContext } from "../context/AuthContext";
import { FiInfo } from "react-icons/fi";

const ChatWindow = () => {
  const { messages, sendMessage, selectedUser, users, sendFile } = useContext(ChatContext);
  const { selectedGroup, sendGroupMessage, groups, groupMessages, getGroupMessages, assignAdmin, fetchGroups, removeMember, removeAdmin } = useContext(GroupContext);
  const { user } = useContext(AuthContext);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false); 
  const messagesEndRef = useRef(null);
  const [addingAdmins, setAddingAdmins] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState([]);


  const displayedMessages = selectedGroup ? (groupMessages[selectedGroup] || []) : messages;

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedGroup) {
        await getGroupMessages(selectedGroup);
      }
    };
    fetchMessages();
  }, [selectedGroup, getGroupMessages]);

  useEffect(() => {
    if (displayedMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedMessages]);

  const currentUser = selectedUser
    ? users.find((u) => u._id === selectedUser) || { username: "User" }
    : null;
  const currentGroup = selectedGroup
    ? groups.find((g) => g._id === selectedGroup)
    : null;

 const handleSend = async () => {
  if (text.trim() || file) {
    if (selectedGroup) {
      const formData = new FormData();
      formData.append("message", text); 
      if (file) formData.append("file", file); 

      await sendGroupMessage(selectedGroup, formData); 
    } else if (selectedUser) {
      if (file) await sendFile(file);
      if (text.trim()) await sendMessage(text);
    }

    setText("");
    setFile(null);
  }
};



  const nothingSelected = !selectedUser && !selectedGroup;

  return (
    <div className="flex-1 flex flex-col border rounded-xl overflow-hidden bg-gray-50 shadow-lg h-full">
      {nothingSelected ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg font-medium">
          👋 Select a user or a group to start chatting
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-md">
            <span>
              💬 {selectedGroup ? `Group: ${currentGroup?.name}` : `Chat with ${currentUser?.username}`}
            </span>
            {selectedGroup && (
              <FiInfo
                onClick={() => setShowGroupInfo(true)}
                className="text-2xl cursor-pointer hover:text-yellow-300 transition-transform duration-200 hover:scale-110"
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {displayedMessages.map((m) => {
              const isOwn = m.sender === user._id || m.sender?._id === user._id;
              const senderName = selectedGroup && !isOwn ? m.sender?.username || "User" : null;

              return (
                <div key={m._id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {senderName && (
                    <div className="text-xs text-gray-500 mb-1 ml-1">{senderName}</div>
                  )}
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-xl shadow-md break-words text-sm ${
                      isOwn
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {m.message || m.text}
                    {m.file && (
                      <div className="mt-1">
                        <a
                          href={m.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`underline text-sm ${isOwn ? "text-yellow-300" : "text-blue-600"}`}
                        >
                          📎 {m.file.split("/").pop()}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 px-4 py-3 border-t bg-white">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer text-blue-600 text-xl">
              📎
            </label>
            <button
              onClick={handleSend}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:opacity-90 transition"
            >
              ➤ Send
            </button>
          </div>

{showGroupInfo && currentGroup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-3xl p-8 w-[1000px] h-[90vh] max-w-full shadow-2xl border border-gray-200 relative flex flex-col">
      {/* Add Admin Button */}
      {/* <button
        onClick={() => setShowGroupInfo(false)}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-600 text-3xl font-bold"
      >
        &times;
      </button> */}
       {user._id === currentGroup.createdBy && !addingAdmins && (
  <button
    onClick={() => setAddingAdmins(true)}
    className="absolute top-6 right-16 px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
  >
    ➕ Add New Admin
  </button>
)}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-600">Group Info</h2>
        <button
          onClick={() => setShowGroupInfo(false)}
          className="text-gray-500 hover:text-gray-800 text-2xl font-bold transition"
        >
          &times;
        </button>
      </div>
      {addingAdmins ? (
        <div className="flex flex-col flex-1">
          <h3 className="text-xl font-semibold mb-3 text-blue-600">
            Select Members to Promote as Admins
          </h3>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4">
            {currentGroup.members
              ?.filter((m) => !currentGroup.admins?.some((a) => a._id === m._id))
              .map((member) => (
                <label
  key={member._id}
  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition ${
    selectedAdmins.includes(member._id) ? "bg-blue-50" : ""
  }`}
>
  <input
    type="checkbox"
    value={member._id}
    checked={selectedAdmins.includes(member._id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedAdmins([...selectedAdmins, member._id]);
      } else {
        setSelectedAdmins(selectedAdmins.filter((id) => id !== member._id));
      }
    }}
    className="w-4 h-4 text-blue-600"
  />
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-white text-sm">
      {member.username.charAt(0).toUpperCase()}
    </div>
    <div className="flex flex-col">
      <p className="font-medium text-sm">{member.username}</p>
      <p className="text-xs text-gray-500">{member.email || ""}</p>
    </div>
  </div>
</label>

              ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setAddingAdmins(false);
                setSelectedAdmins([]);
              }}
              className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  
                  for (const memberId of selectedAdmins) {
                    await assignAdmin(currentGroup._id, memberId);
                    fetchGroups();
                  }
                  setAddingAdmins(false);
                  setSelectedAdmins([]);
                } catch (err) {
                  console.error("Error promoting admins:", err);
                }
              }}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Admins Section */}
<h3 className="text-xl font-semibold mb-3">Admins</h3>
<div className="mb-6 grid grid-cols-2 gap-4">
  {currentGroup.admins?.map((admin) => {
    if (!admin?.username) return null;
    return (
      <div
        key={admin._id}
        className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg shadow hover:shadow-md transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-semibold text-white text-lg">
            {admin.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{admin.username}</p>
            <p className="text-xs text-gray-500">{admin.email || ""}</p>
          </div>
        </div>
        {user._id === currentGroup.createdBy && (
  <button
    onClick={async () => {
      try {
        await removeAdmin(currentGroup._id, admin._id);
        fetchGroups();
      } catch (err) {
        console.error("Error removing admin:", err);
      }
    }}
    className="text-red-500 font-bold text-lg hover:text-red-700"
  >
    &times;
  </button>
)}

      </div>
    );
  })}
</div>

{/* Members Section */}
<h3 className="text-xl font-semibold mb-3">Members</h3>
<div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4">
  {currentGroup.members?.map((member) => {
    if (!member?.username) return null;
    return (
      <div
        key={member._id}
        className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow hover:shadow-md transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center font-semibold text-white text-lg">
            {member.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{member.username}</p>
            <p className="text-xs text-gray-500">{member.email || ""}</p>
          </div>
        </div>
        {user._id === currentGroup.createdBy && (
  <button
    onClick={async () => {
      try {
        await removeMember(currentGroup._id, member._id);
        fetchGroups();
      } catch (err) {
        console.error("Error removing member:", err);
      }
    }}
    className="text-red-500 font-bold text-lg hover:text-red-700"
  >
    &times;
  </button>
)}

      </div>
    );
  })}
</div>

        </>
      )}
    </div>
  </div>
)}

        </>
      )}
    </div>
  );
};

export default ChatWindow;
