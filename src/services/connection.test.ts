import { afterEach, expect, test } from 'bun:test';
import { clearConnection, connect, connectionHeaders, connectionModel, hasSessionKey } from './connection';
import { requestKey, validModel, connectionError } from '../../server/connection';
import { fetchHealth, streamChatCompletion } from './api';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; clearConnection(); });
test('a verified session key is sent through the gateway and can be removed', async () => {
  const requests: RequestInit[] = [];
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    requests.push(init || {});
    return Response.json({ connected: true });
  }) as unknown as typeof fetch;
  await connect(' test-only-key ', 'gpt-4o');
  expect(hasSessionKey()).toBe(true);
  expect(connectionHeaders()).toEqual({ Authorization: 'Bearer test-only-key' });
  expect(connectionModel()).toBe('gpt-4o');
  expect(requests[0].body).not.toContain('test-only-key');
  clearConnection();
  expect(connectionHeaders()).toEqual({});
  expect(connectionModel()).toBeUndefined();
});
test('failed or cancelled verification never replaces credentials', async () => {
  globalThis.fetch = (async () => Response.json({ error: 'Rejected' }, { status: 400 })) as unknown as typeof fetch;
  await expect(connect('test-invalid', 'gpt-4o')).rejects.toThrow('Rejected');
  expect(hasSessionKey()).toBe(false);
  globalThis.fetch = (async () => Response.json({ connected: true })) as unknown as typeof fetch;
  const controller = new AbortController(); controller.abort();
  await connect('test-cancelled', 'gpt-4o', controller.signal);
  expect(hasSessionKey()).toBe(false);
});
test('health and streaming both use the verified session configuration', async () => {
  globalThis.fetch = (async () => Response.json({ connected: true })) as unknown as typeof fetch;
  await connect('test-only-key', 'custom-model');
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-only-key');
    if (init?.method === 'POST') {
      expect(JSON.parse(String(init.body)).model).toBe('custom-model');
      return new Response('data: {"text":"OK"}\n\ndata: [DONE]\n\n');
    }
    return Response.json({ status: 'ok', hasApiKey: true, model: 'server-model', provider: 'openai' });
  }) as unknown as typeof fetch;
  expect((await fetchHealth()).model).toBe('custom-model');
  let result = '';
  await streamChatCompletion({ messages: [{ role: 'user', content: 'Hello' }], onChunk: text => { result += text; }, onDone() {}, onError(error) { throw new Error(error); } });
  expect(result).toBe('OK');
});
test('server uses request credentials and validates model names without leaking errors', () => {
  expect(requestKey(new Request('http://localhost', { headers: { Authorization: 'Bearer test-only-key' } }))).toBe('test-only-key');
  expect(validModel('gpt-4o')).toBe(true);
  expect(validModel('../models')).toBe(false);
  expect(validModel({ model: 'gpt-4o' })).toBe(false);
  expect(connectionError(new Error('test-secret'))).not.toContain('test-secret');
});
