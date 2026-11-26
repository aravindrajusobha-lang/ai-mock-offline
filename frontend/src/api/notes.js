import { apiRequest } from './client.js';

export function getNotes() {
  return apiRequest('/api/notes');
}

export function createNote(text) {
  return apiRequest('/api/notes', {
    method: 'POST',
    body: { text },
  });
}

export function uploadNote(file) {
  const formData = new FormData();
  formData.set('file', file);
  return apiRequest('/api/notes/upload', {
    method: 'POST',
    body: formData,
  });
}

export function deleteNote(id) {
  return apiRequest(`/api/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function extractNotes(response) {
  const notes = Array.isArray(response)
    ? response
    : response?.notes ?? response?.data?.notes ?? response?.data;
  if (!Array.isArray(notes)) {
    throw new TypeError('The TalkReady server returned an invalid notes list.');
  }
  return notes;
}

export function extractImportPreview(response) {
  const result = response?.preview ?? response?.data?.preview ?? response?.data ?? response;
  const topics = result?.topicCount
    ?? result?.topicsFound
    ?? (Array.isArray(result?.topics) ? result.topics.length : null);
  const questions = result?.possibleQuestionCount
    ?? result?.possibleQuestions
    ?? result?.questionCount
    ?? (Array.isArray(result?.questions) ? result.questions.length : null);

  return {
    title: response?.note?.title
      ?? response?.data?.note?.title
      ?? result?.note?.title
      ?? result?.title
      ?? 'Your notes',
    topicCount: Number.isSafeInteger(topics) && topics >= 0 ? topics : null,
    questionCount: Number.isSafeInteger(questions) && questions >= 0 ? questions : null,
  };
}
