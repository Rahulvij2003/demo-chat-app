import UserList from "./UsersList";
import ChatWindow from "./ChatWindow";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { GroupProvider } from "../context/GroupContext";

const Home = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    // AuthContext is null before provider is ready
    return null;
  }

  const { logout } = auth;

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
      <div
        style={{
          padding: "10px",
          borderBottom: "1px solid gray",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>Chat App</h2>
        <button onClick={logout}>Logout</button>
      </div>
      <div className="flex h-full">
        <GroupProvider>
          <UserList />
          <ChatWindow />
        </GroupProvider>
      </div>
    </div>
  );
};

export default Home;
