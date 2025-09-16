import { createContext, useState, useEffect } from "react";
import API from "../axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          let res = await API.get("/auth/users", { withCredentials: true }); // send cookies

          if (res.status === 401) {
            const refreshRes = await API.post("/auth/refresh-token", {}, { withCredentials: true });

            if (refreshRes.ok || refreshRes.status === 200) {
              res = await API.get("/auth/users", { withCredentials: true });
            } else {
              localStorage.removeItem("user");
              setUser(null);
              return;
            }
          }

          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error(err);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);


  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password }, { withCredentials: true });
    setUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  };

  const register = async (username, email, password) => {
    const res = await API.post("/auth/register", { username, email, password });
    return res.data;
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
