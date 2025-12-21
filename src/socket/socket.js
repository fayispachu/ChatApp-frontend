import { io } from "socket.io-client";

export const connectSocket = () => {
  return io("https://chatapp-backend-p8q9.onrender.com", {
    auth: { token: localStorage.getItem("token") },
  });
};
