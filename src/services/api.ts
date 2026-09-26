import type { ChatMessage, HealthStatus } from '../types/chat';
import { getMockResponseForPrompt } from './mockData';
import { connectionHeaders, connectionModel } from './connection';
const demoHealth: HealthStatus = { status: 'ok', hasApiKey: false, provider: 'mock', model: 'Offline demo' };
export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch('/api/health', { headers: connectionHeaders(), signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('Unavailable');
    const data: HealthStatus = await res.json();
    return data.hasApiKey ? { ...data, model: connectionModel() || data.model } : demoHealth;
  } catch { return demoHealth; }
}
export interface StreamChatParams {
  messages: ChatMessage[];
  provider?: string;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}
export async function streamMockCompletion({ messages, onChunk, onDone, signal }: StreamChatParams): Promise<void> {
  const prompt = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const response = getMockResponseForPrompt(prompt);
  for (let i = 0; i < response.length; i += 48) {
    if (signal?.aborted) return;
    onChunk(response.slice(i, i + 48));
    await new Promise(resolve => setTimeout(resolve, 12));
  }
  if (!signal?.aborted) onDone();
}
export async function streamChatCompletion(params: StreamChatParams): Promise<void> {
  if (params.provider === 'mock') return streamMockCompletion(params);
  const { messages, onChunk, onError, onDone, signal } = params;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...connectionHeaders() },
      body: JSON.stringify({ messages, provider: 'openai', model: connectionModel() }), signal,
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.error || `Request failed (${response.status}). Please try again.`);
    }
    if (!response.body) throw new Error('The server returned an empty response.');
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;
    const consume = (frame: string) => {
      const data = frame.split('\n').filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trimStart()).join('\n').trim();
      if (!data) return;
      if (data === '[DONE]') { completed = true; return; }
      const payload = JSON.parse(data);
      if (payload.error) throw new Error(payload.error);
      if (typeof payload.text === 'string') onChunk(payload.text);
    };
    while (!completed) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1 && !completed) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
      }
      if (done) {
        if (buffer.trim() && !completed) consume(buffer);
        if (!completed) throw new Error('The response was interrupted. Please try again.');
        break;
      }
    }
    if (!signal?.aborted) onDone();
  } catch (error) {
    if (!signal?.aborted) onError(error instanceof Error ? error.message : 'Unable to generate a response.');
  } finally {
    await reader?.cancel().catch(() => {});
    reader?.releaseLock();
  }
}
