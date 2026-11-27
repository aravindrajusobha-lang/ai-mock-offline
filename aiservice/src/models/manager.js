const DEFAULT_BASE = 'http://127.0.0.1:11434';

function localBaseUrl(value = process.env.TALKREADY_LOCAL_MODEL_URL || DEFAULT_BASE) {
  let url;
  try { url = new URL(value); } catch { throw new TypeError('Local model URL must be a valid loopback HTTP URL.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]', '::1'].includes(host)) throw new TypeError('AI model URL must use HTTP on localhost or a loopback IP.');
  return url.origin;
}

export async function getModelStatus({ baseUrl, fetchImpl = fetch, timeoutMs = 1200 } = {}) {
  const base = localBaseUrl(baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${base}/api/tags`, { signal: controller.signal });
    if (!response.ok) return { available: false, runner: 'ollama-local', models: [], reason: `Local model runner returned HTTP ${response.status}.` };
    const body = await response.json();
    return { available: true, runner: 'ollama-local', models: (body.models ?? []).map(model => ({ name: model.name, size: model.size, modifiedAt: model.modified_at })) };
  } catch {
    return { available: false, runner: 'ollama-local', models: [], reason: 'No local model runner is available. Deterministic template mode remains ready.' };
  } finally { clearTimeout(timer); }
}

export async function generateWithLocalModel({ model, messages, baseUrl, fetchImpl = fetch, timeoutMs = 60_000 } = {}) {
  if (typeof model !== 'string' || !model.trim()) throw new TypeError('Choose a locally installed model name.');
  if (!Array.isArray(messages) || !messages.length) throw new TypeError('At least one chat message is required.');
  const base = localBaseUrl(baseUrl);
  const status = await getModelStatus({ baseUrl: base, fetchImpl });
  if (!status.available) throw new Error(status.reason);
  const installed = status.models.some(entry => entry.name === model);
  if (!installed) throw new Error(`Model "${model}" is not installed locally. Install it explicitly before selecting it; no download was attempted.`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, messages, stream: false }), signal: controller.signal });
    if (!response.ok) throw new Error(`Local model runner returned HTTP ${response.status}.`);
    const result = await response.json();
    const content = result.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Local model returned an empty response.');
    return { content, model, runner: 'ollama-local' };
  } finally { clearTimeout(timer); }
}

export function isLocalModelRunnerConfigured() {
  try { localBaseUrl(); return true; } catch { return false; }
}
