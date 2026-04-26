import axios from "axios";

const API = axios.create({
  baseURL: "https://chatapp-backend-p8q9.onrender.com/api",
  withCredentials: true,
});

// Interceptor to attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;