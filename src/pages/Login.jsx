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
      setError(err.response?.data?.message || "Login failed");
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-black text-cyan-400 px-4">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      {error && (
        <p className="text-red-500 bg-black px-4 py-2 rounded mb-4 w-full text-center">
          {error}
        </p>
      )}

      <div className="w-full max-w-sm flex flex-col gap-4">
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-3 rounded bg-black border border-cyan-700 placeholder-cyan-700 text-cyan-400 focus:outline-none focus:border-cyan-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 rounded bg-black border border-cyan-700 placeholder-cyan-700 text-cyan-400 focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={login}
          className="bg-cyan-700 text-black py-3 rounded font-semibold hover:bg-cyan-600 transition-colors"
        >
          Login
        </button>
      </div>

      <p
        className="mt-6 text-sm cursor-pointer hover:underline text-cyan-500"
        onClick={() => setMode("register")}
      >
        Don't have an account? Register
      </p>
    </div>
  );
}
