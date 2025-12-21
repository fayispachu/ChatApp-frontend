import { useEffect, useState } from "react";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login");

  // Restore login on refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    if (token && storedUserId) {
      setUserId(storedUserId);
    }
    setLoading(false);
  }, []);

  // Called after login
  const handleLogin = (data) => {
    // Ensure backend returns { token, userId } exactly
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    setUserId(data.userId);
  };

  const logout = () => {
    localStorage.clear();
    setUserId(null);
    setMode("login");
  };

  if (loading) return null;

  return userId ? (
    <Chat userId={userId} logout={logout} />
  ) : mode === "login" ? (
    <Login onLogin={handleLogin} setMode={setMode} />
  ) : (
    <Register setMode={setMode} />
  );
}

export default App;
