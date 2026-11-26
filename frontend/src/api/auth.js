import { apiRequest } from './client.js';

export function login(credentials) {
  return apiRequest('/api/auth/login', { method: 'POST', body: credentials });
}

export function register(details) {
  return apiRequest('/api/auth/register', { method: 'POST', body: details });
}

export function getCurrentUser() {
  return apiRequest('/api/auth/me');
}
