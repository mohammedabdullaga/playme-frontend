import axios from 'axios';

const RESELLER_API_BASE_URL = process.env.REACT_APP_RESELLER_API_BASE_URL || 'https://api.playmetod.store';
const PROXY_API_BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL || 'https://proxyapi.playmetod.store';

function createApiClient(baseURL) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const resellerId = localStorage.getItem('reseller_id');
    const authToken = localStorage.getItem('reseller_proxy_token');
    if (resellerId) {
      config.params = { ...config.params, reseller_id: resellerId };
    }
    if (authToken && !config.headers?.Authorization) {
      config.headers = { ...config.headers, Authorization: `Bearer ${authToken}` };
    }
    return config;
  });

  return client;
}

const API = createApiClient(RESELLER_API_BASE_URL);
export const ProxyAPI = createApiClient(PROXY_API_BASE_URL);

export default API;
