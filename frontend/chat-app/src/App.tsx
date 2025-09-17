import { ReactNode } from "react";
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext"; 
import { ChatProvider } from "./context/ChatContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth(); // safe access

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth(); // safe access

  return (
    <Routes>
      {!user && (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
      {user && (
        <>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <ChatProvider>
                  <Home />
                </ChatProvider>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Navigate to="/home" replace />} />
          <Route path="/register" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </>
      )}
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="h-screen overflow-hidden">
        <Router>
          <AppContent />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
