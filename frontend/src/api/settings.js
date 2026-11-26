import { apiRequest } from './client.js';

export function deleteAllData() {
  return apiRequest('/api/data', { method: 'DELETE' });
}
