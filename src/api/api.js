import axios from "axios";

const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "https://chatapp-backend-p8q9.onrender.com";

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// Interceptor to attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;



// https://chatapp-backend-p8q9.onrender.com