function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3003';
  }

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('proxy-admin')) {
    return 'https://proxyapi.playmetod.store';
  }
  if (hostname.includes('reseller')) {
    return 'https://api.playmetod.store';
  }
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'http://localhost:3003';
  }

  return 'https://proxyapi.playmetod.store';
}

const API_BASE_URL = resolveApiBaseUrl();

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export function login(username, password) {
  return request('/api/auth/login', { method: 'POST', body: { username, password } });
}

export function getProxies(token) {
  return request('/api/proxies', { token });
}

export function createProxy(payload, token) {
  return request('/api/proxies', { method: 'POST', body: payload, token });
}

export function updateProxy(id, payload, token) {
  return request(`/api/proxies/${id}`, { method: 'PUT', body: payload, token });
}

export function deleteProxy(id, token) {
  return request(`/api/proxies/${id}`, { method: 'DELETE', token });
}

export function getUsers(token) {
  return request('/api/users', { token });
}

export function createUser(payload, token) {
  return request('/api/users', { method: 'POST', body: payload, token });
}

export function disableUser(id, token) {
  return request(`/api/users/${id}/disable`, { method: 'POST', token });
}

export function deleteUser(id, token) {
  return request(`/api/users/${id}`, { method: 'DELETE', token });
}

export function reactivateUser(id, expiresAt, token) {
  return request(`/api/users/${id}/reactivate`, { method: 'POST', body: { expires_at: expiresAt }, token });
}

export function getUserConfig(id, token) {
  return request(`/api/users/${id}/config`, { token });
}

export function getResellerUsers(token, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/api/reseller/users${query}`, { token });
}

export function createResellerUser(payload, token) {
  return request('/api/reseller/users', { method: 'POST', body: payload, token });
}

export function getResellerUserConfig(id, token) {
  return request(`/api/reseller/users/${id}/config`, { token });
}

export function getAuditLogs(token) {
  return request('/api/audit/logs', { token });
}
