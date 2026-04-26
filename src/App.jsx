import { useEffect, useState } from "react";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <AnimatePresence mode="wait">
        {userId ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            <Chat userId={userId} logout={logout} />
          </motion.div>
        ) : mode === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Login onLogin={handleLogin} setMode={setMode} />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Register setMode={setMode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
