import { useEffect, useState } from "react";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId");
    if (token && storedUserId) {
      setUserId(storedUserId);
    }
    setLoading(false);
  }, []);

  const handleLogin = (data) => {
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

  if (userId) return <Chat userId={userId} logout={logout} />;

  return mode === "login" ? (
    <Login onLogin={handleLogin} setMode={setMode} />
  ) : (
    <Register setMode={setMode} />
  );
}

export default App;
