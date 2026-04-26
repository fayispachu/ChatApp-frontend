import { io } from "socket.io-client";

const SOCKET_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "https://chatapp-backend-p8q9.onrender.com";

export const connectSocket = () => {
  return io(SOCKET_URL, {
    auth: { token: localStorage.getItem("token") },
  });
};
// https://chatapp-backend-p8q9.onrender.com

// http://localhost:5000