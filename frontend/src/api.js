import axios from "axios";

// Backend adresi build sırasında VITE_API_URL ile verilir (Railway frontend servisinin
// Variables'ı veya lokal frontend/.env). Sonu /api olmalı. Verilmezse eski prod adresine düşer.
export const API = (
  import.meta.env.VITE_API_URL || "https://crm-prebably-production.up.railway.app/api"
).replace(/\/$/, "");
export const SOCKET_URL = API.replace(/\/api$/, "");

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
