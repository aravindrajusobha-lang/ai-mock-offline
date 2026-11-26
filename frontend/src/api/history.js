import { ApiError, apiRequest } from './client.js';

export async function getHistory() {
  const response = await apiRequest('/api/history');
  const sessions = Array.isArray(response)
    ? response
    : response?.sessions ?? response?.data?.sessions ?? response?.data;
  if (!Array.isArray(sessions)) {
    throw new ApiError('The TalkReady server returned an invalid history list.', {
      code: 'INVALID_HISTORY_RESPONSE',
      details: response,
    });
  }
  return sessions;
}

export async function getProgress() {
  const response = await apiRequest('/api/progress');
  const progress = response?.progress ?? response?.data?.progress ?? response?.data ?? response;
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    throw new ApiError('The TalkReady server returned invalid progress data.', {
      code: 'INVALID_PROGRESS_RESPONSE',
      details: response,
    });
  }
  return progress;
}
