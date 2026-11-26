import { apiRequest } from './client.js';

export function startInterview(options) {
  return apiRequest('/api/interviews', {
    method: 'POST',
    body: options,
  });
}

export function getInterview(id) {
  return apiRequest(`/api/interviews/${encodeURIComponent(id)}`);
}

export function submitAnswer(id, answer) {
  return apiRequest(`/api/interviews/${encodeURIComponent(id)}/answer`, {
    method: 'POST',
    body: { answer },
  });
}

export function requestHint(id, level) {
  return apiRequest(`/api/interviews/${encodeURIComponent(id)}/hint`, {
    method: 'POST',
    body: { level },
  });
}

export function skipQuestion(id) {
  return apiRequest(`/api/interviews/${encodeURIComponent(id)}/skip`, {
    method: 'POST',
  });
}

export function finishInterview(id) {
  return apiRequest(`/api/interviews/${encodeURIComponent(id)}/finish`, {
    method: 'POST',
  });
}
