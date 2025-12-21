import { useState } from "react";
import API from "../api/api";

export default function Login({ onLogin, setMode }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    try {
      const res = await API.post("/auth/login", { username, password });
      onLogin(res.data); // { token, userId }
    } catch (err) {
      setError(err.response?.data || "Login failed");
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h1 className="text-2xl mb-4">Login</h1>
      {error && <p className="text-red-400 mb-2">{error}</p>}
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="p-2 mb-2 rounded text-black"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-2 mb-2 rounded text-black"
      />
      <button onClick={login} className="bg-blue-600 px-4 py-2 rounded">
        Login
      </button>
      <p
        className="text-sm text-blue-400 cursor-pointer mt-2"
        onClick={() => setMode("register")}
      >
        Create account
      </p>
    </div>
  );
}
