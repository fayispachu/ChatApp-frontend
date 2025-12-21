import { useState } from "react";
import API from "../api/api";

export default function Register({ setMode }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const register = async () => {
    try {
      await API.post("/auth/register", { username, password });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => setMode("login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-black text-cyan-400 px-4">
      <h1 className="text-3xl font-bold mb-6">Register</h1>

      {error && (
        <p className="text-red-500 bg-black px-4 py-2 rounded mb-4 w-full text-center">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-500 bg-black px-4 py-2 rounded mb-4 w-full text-center">
          {success}
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
          onClick={register}
          className="bg-cyan-700 text-black py-3 rounded font-semibold hover:bg-cyan-600 transition-colors"
        >
          Register
        </button>
      </div>

      <p
        className="mt-6 text-sm cursor-pointer hover:underline text-cyan-500"
        onClick={() => setMode("login")}
      >
        Already have an account? Login
      </p>
    </div>
  );
}
