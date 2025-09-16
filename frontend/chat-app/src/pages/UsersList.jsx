import { useContext, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { GroupContext } from "../context/GroupContext";
import { AuthContext } from "../context/AuthContext";
import { FiPlus } from "react-icons/fi";

const UserList = () => {
  const { users, fetchMessages, selectedUser } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const { groups, createGroup, fetchGroups, setSelectedGroup } = useContext(GroupContext);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("users");

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "?";

  const handleCreateGroup = async () => {
    try {
      const res = await createGroup(groupName, groupMembers);
      console.log("Group created:", res.group);
      setGroupName("");
      setGroupMembers([]);
      setShowCreateGroup(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  return (
    <div className="w-80 h-screen flex flex-col bg-gray-50 border-r shadow-lg">
      <div className="flex p-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold shadow-md rounded-b-lg">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 ${
            activeTab === "users" ? "bg-white text-blue-600 shadow-md" : "bg-transparent hover:bg-white/20"
          }`}
        >
          Chat Users
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 ${
            activeTab === "groups" ? "bg-white text-blue-600 shadow-md" : "bg-transparent hover:bg-white/20"
          }`}
        >
          My Groups
        </button>
        {activeTab === "groups" && (
          <FiPlus
            className="ml-2 cursor-pointer text-2xl hover:text-blue-200 transition-transform duration-200 hover:scale-110"
            onClick={() => setShowCreateGroup(true)}
          />
        )}
      </div>
      {activeTab === "users" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedGroup(null); 
                fetchMessages(u._id);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                ${
                  selectedUser === u._id
                    ? "bg-blue-100 text-blue-700 shadow-lg transform scale-105"
                    : "bg-white hover:bg-blue-50 text-gray-800 shadow-sm"
                }`}
            >
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full font-semibold text-white text-lg 
                  ${
                    selectedUser === u._id
                      ? "bg-blue-600"
                      : "bg-gradient-to-tr from-indigo-400 to-blue-500"
                  }`}
              >
                {getInitial(u.username)}
              </div>
              <span className="text-md font-medium">{u.username}</span>
            </div>
          ))}
        </div>
      )}
      {activeTab === "groups" && (
  <div className="flex-1 overflow-y-auto p-3 space-y-3">
    {groups.map((g) => (
      <div
        key={g._id}
        onClick={() => {
          console.log("Group clicked:", g._id); // Debug log
          fetchGroups(); // optional: refresh groups if needed
          // Set the selected group in GroupContext
          // Make sure you destructure setSelectedGroup from GroupContext
          setSelectedGroup(g._id);
        }}
        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 bg-white hover:bg-green-50 shadow-sm hover:shadow-md"
      >
        <div
          className="w-12 h-12 flex items-center justify-center rounded-full font-semibold text-white text-lg bg-gradient-to-tr from-green-400 to-teal-500"
        >
          {getInitial(g.name)}
        </div>
        <span className="text-md font-medium">{g.name}</span>
      </div>
    ))}
  </div>
)}

{showCreateGroup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-gray-200">
      <h2 className="text-2xl font-bold mb-5 text-center text-blue-600">Create New Group</h2>
      
      <input
        type="text"
        placeholder="Group Name"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

<div className="mb-4">
  <label className="block mb-1 font-medium text-gray-700">Select Members</label>
  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
    {users
      .filter((u) => u._id !== user?._id) // exclude self
      .map((u) => (
        <div key={u._id} className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={groupMembers.includes(u._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setGroupMembers((prev) => [...prev, u._id]);
              } else {
                setGroupMembers((prev) => prev.filter((id) => id !== u._id));
              }
            }}
            className="w-4 h-4 accent-blue-600"
          />
          <span>{u.username} ({u.email})</span>
        </div>
      ))}
  </div>
</div>

<div className="flex flex-wrap gap-2 mb-4">
  {groupMembers.map((id) => {
    const member = users.find((u) => u._id === id);
    if (!member) return null;
    return (
      <div
        key={id}
        className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
      >
        <span>{member.username}</span>
        <button
          onClick={() =>
            setGroupMembers((prev) => prev.filter((mId) => mId !== id))
          }
          className="text-blue-500 hover:text-blue-700 font-bold"
        >
          &times;
        </button>
      </div>
    );
  })}
</div>


      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowCreateGroup(false)}
          className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-medium transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateGroup}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-all duration-200"
        >
          Create
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default UserList;
