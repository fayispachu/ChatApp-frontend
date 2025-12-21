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
      setSuccess("Registration done. Redirecting to login...");
      setTimeout(() => setMode("login"), 1500);
    } catch (err) {
      setError(err.response?.data || "Registration failed");
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h1 className="text-2xl mb-4">Register</h1>
      {error && <p className="text-red-400 mb-2">{error}</p>}
      {success && <p className="text-green-400 mb-2">{success}</p>}
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
      <button onClick={register} className="bg-blue-600 px-4 py-2 rounded">
        Register
      </button>
      <p
        className="text-sm text-blue-400 cursor-pointer mt-2"
        onClick={() => setMode("login")}
      >
        Already have an account? Login
      </p>
    </div>
  );
}
