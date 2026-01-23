import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const key = localStorage.getItem("admin_key");
  if (key) {
    config.headers["X-API-Key"] = key;
  }
  return config;
});

export default API;
