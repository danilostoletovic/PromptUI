// Credentials deliberately live only in memory, never browser storage or chat history.
let apiKey = '';
let model = '';
export function hasSessionKey() { return Boolean(apiKey); }
export function connectionHeaders(): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}
export function connectionModel() { return model || undefined; }
export function clearConnection() { apiKey = ''; model = ''; }
export async function connect(key: string, selectedModel: string, signal?: AbortSignal) {
  const response = await fetch('/api/connection', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key.trim()}` },
    body: JSON.stringify({ model: selectedModel.trim() }), signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'Could not connect. Check that the backend is running.');
  if (signal?.aborted) return;
  apiKey = key.trim(); model = selectedModel.trim();
}
