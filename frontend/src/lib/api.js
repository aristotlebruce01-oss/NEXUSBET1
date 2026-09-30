import axios from "axios";

const configuredBackend = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
const BACKEND_URL = /^https?:\/\/localhost(?::\d+)?$/i.test(configuredBackend) ? configuredBackend.replace(/localhost/i, "127.0.0.1") : configuredBackend;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
