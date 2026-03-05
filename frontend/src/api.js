// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔐 Token attached to request");
      } else {
        console.warn("⚠️ No token found in localStorage");
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error("❌ 401 Unauthorized - redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "/auth";
      }
      return Promise.reject(error);
    }
);

export default api;