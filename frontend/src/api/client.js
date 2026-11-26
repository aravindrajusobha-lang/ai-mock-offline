const TOKEN_KEY = 'talkready.authToken';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BackendUnreachableError extends ApiError {
  constructor(cause) {
    super("Can't reach the TalkReady server", {
      code: 'BACKEND_UNREACHABLE',
      details: cause,
    });
    this.name = 'BackendUnreachableError';
    this.cause = cause;
  }
}

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('An authentication token must be a non-empty string.');
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function normalizeIds(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeIds);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const normalized = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key !== '_id') {
      normalized[key] = normalizeIds(nestedValue);
    }
  }
  if (normalized.id === undefined && value._id !== undefined) {
    normalized.id = normalizeIds(value._id);
  }
  return normalized;
}

async function readResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (cause) {
    if (response.ok) {
      throw new ApiError('The TalkReady server returned an invalid response.', {
        status: response.status,
        code: 'INVALID_RESPONSE',
        details: cause,
      });
    }
    return { message: text };
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, signal } = {}) {
  if (typeof path !== 'string' || !path.startsWith('/api/')) {
    throw new TypeError('API paths must be relative and start with /api/.');
  }

  const requestHeaders = new Headers(headers);
  const token = getAuthToken();
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new BackendUnreachableError(cause);
    }
    throw cause;
  }

  const payload = await readResponse(response);
  if (!response.ok) {
    const errorPayload = payload?.error ?? payload;
    if (errorPayload?.code === 'BACKEND_UNREACHABLE') {
      throw new BackendUnreachableError(errorPayload);
    }
    throw new ApiError(
      errorPayload?.message || `TalkReady request failed with status ${response.status}.`,
      {
        status: response.status,
        code: errorPayload?.code || 'API_ERROR',
        details: errorPayload?.details ?? errorPayload,
      },
    );
  }

  return normalizeIds(payload);
}
