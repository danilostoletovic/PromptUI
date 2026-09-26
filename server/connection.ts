import OpenAI from 'openai';
export function requestKey(req: Request): string {
  const auth = req.headers.get('authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7).trim() : (process.env.OPENAI_API_KEY || '').trim();
}
export function validModel(model: unknown): model is string {
  return typeof model === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,150}$/.test(model);
}
export function connectionError(error: unknown): string {
  const status = error instanceof OpenAI.APIError ? error.status : undefined;
  if (status === 401) return 'The API key was rejected. Check the key and try again.';
  if (status === 403 || status === 404) return 'This key cannot access the selected model. Check the model name and project permissions.';
  if (status === 429) return 'OpenAI reported a quota or rate limit. Check your API billing and try again.';
  return 'Could not reach OpenAI. Check your connection and try again.';
}
