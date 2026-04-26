import { io } from "socket.io-client";

export const connectSocket = () => {
  return io("http://localhost:5000", {
    auth: { token: localStorage.getItem("token") },
  });
};
// https://chatapp-backend-p8q9.onrender.com

// http://localhost:5000