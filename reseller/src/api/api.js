import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://api.playmetod.store',
});

API.interceptors.request.use((config) => {
  const resellerId = localStorage.getItem('reseller_id');
  if (resellerId) {
    config.params = { ...config.params, reseller_id: resellerId };
  }
  return config;
});

export default API;
