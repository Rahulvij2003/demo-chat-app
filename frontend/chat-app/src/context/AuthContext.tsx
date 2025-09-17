import { createContext, useState, useEffect, ReactNode } from "react";
import API from "../axios";
import { useContext } from "react";
// Define User type (adjust fields if your backend sends more)
export interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
}

// Define AuthContext value type
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Define AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create context with default (null so we check in consumer)
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          let res = await API.get("/auth/users", { withCredentials: true });

          if (res.status === 401) {
            const refreshRes = await API.post(
              "/auth/refresh-token",
              {},
              { withCredentials: true }
            );

            if (refreshRes.status === 200) {
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

  const login = async (email: string, password: string): Promise<void> => {
    const res = await API.post("/auth/login", { email, password }, { withCredentials: true });
    setUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  };

  const register = async (username: string, email: string, password: string): Promise<any> => {
    const res = await API.post("/auth/register", { username, email, password });
    return res.data;
  };

  const logout = async (): Promise<void> => {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
