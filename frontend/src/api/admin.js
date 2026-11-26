import { apiRequest } from './client.js';

export function getUserCount() {
  return apiRequest('/api/admin/users/count');
}
