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

// Admin helper functions
export const adminCreateTokens = (days, count) => API.post(`/admin/tokens?days=${days}&count=${count}`);
export const adminCreateTokensV1 = (days, count) => API.post(`/admin/tokens/v1?days=${days}&count=${count}`);
export const adminCreateTokensV2 = (days, count) => API.post(`/admin/tokens/v2?days=${days}&count=${count}`);
export const adminGetDevices = () => API.get(`/admin/devices`);
export const adminDeactivateDevice = (mac) => API.post(`/admin/devices/${mac}/deactivate`);
export const adminActivateDevice = (mac) => API.post(`/admin/devices/${mac}/activate`);
export const adminUpdateDevice = (mac, data) => API.put(`/admin/devices/${mac}`, data);
export const adminSetProxy = (data) => API.post(`/admin/proxy`, data);
export const adminGetMessages = () => API.get(`/admin/messages`);
export const adminCreateMessage = (msg) => API.post(`/admin/messages`, msg);
export const adminUpdateMessage = (id, msg) => API.put(`/admin/messages/${id}`, msg);
export const adminDeleteMessage = (id) => API.delete(`/admin/messages/${id}`);
export const adminGetStatus = () => API.get(`/admin/app/status`);
export const adminSetStatus = (allowed, expiresAt) => API.put(`/admin/app/status`, { allowed, expires_at: expiresAt });
export const adminGetHeartbeats = () => API.get(`/admin/heartbeats`);
export const getProxyList = () => API.get(`/app/proxy`);
export const adminGetResellers = () => API.get(`/admin/resellers`);
export const adminCreateReseller = (data) => API.post(`/admin/resellers`, data);
export const adminUpdateReseller = (id, data) => API.put(`/admin/resellers/${id}`, data);
export const adminDeleteReseller = (id) => API.delete(`/admin/resellers/${id}`);
export const adminTopUpReseller = (data) => API.post(`/admin/resellers/top-up`, data);
export const adminGetResellerPricing = () => API.get(`/admin/resellers/pricing`);
export const adminUpdateResellerPricing = (data) => API.put(`/admin/resellers/pricing`, data);
export const adminGetResellerActivity = () => API.get(`/admin/resellers/activity`);

// User/Account management endpoints
export const adminGetAccounts = () => API.get(`/admin/accounts`);
export const adminGetAccount = (email) => API.get(`/admin/accounts/${encodeURIComponent(email)}`);
export const adminUpdateAccount = (email, data) => API.put(`/admin/accounts/${encodeURIComponent(email)}`, data);
export const adminDeleteAccount = (email) => API.delete(`/admin/accounts/${encodeURIComponent(email)}`);
