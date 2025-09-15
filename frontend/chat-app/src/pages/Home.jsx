import UserList from "./UsersList";
import ChatWindow from "./ChatWindow";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
    const { logout } = useContext(AuthContext);
  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
      <div style={{ padding: "10px", borderBottom: "1px solid gray", display: "flex", justifyContent: "space-between" }}>
        <h2>Chat App</h2>
        <button onClick={logout}>Logout</button>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <UserList />
        <ChatWindow />
      </div>
    </div>
  );
};

export default Home;