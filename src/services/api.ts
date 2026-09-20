import type { ChatMessage, HealthStatus } from '../types/chat';
import { getMockResponseForPrompt } from './mockData';

/**
 * ============================================================================
 * API SERVICE & PROVIDER INTEGRATION GUIDE
 * ============================================================================
 * 
 * 1. REAL OPENAI API:
 *    - `streamChatCompletion` sends requests to the Bun backend server endpoint `/api/chat`.
 *    - The backend uses the official OpenAI Node SDK with SSE streaming (`gpt-4o`).
 *    - Requires `OPENAI_API_KEY` configured in your `.env` file.
 * 
 * 2. SEAMLESS MOCK FALLBACK (Default: enabled):
 *    - `USE_MOCK_FALLBACK = true`: If the backend server is offline or no API key
 *      is configured, the client automatically falls back to the interactive mock generator.
 *    - `FORCE_MOCK_MODE = true`: Forces mock mode exclusively without attempting backend calls.
 * ============================================================================
 */
export const USE_MOCK_FALLBACK = true;
export const FORCE_MOCK_MODE = false;

/**
 * Health status check connecting to Bun backend gateway with mock fallback.
 */
export async function fetchHealth(): Promise<HealthStatus> {
  if (FORCE_MOCK_MODE) {
    return {
      status: 'ok',
      hasApiKey: false,
      provider: 'mock',
      model: 'mock-gpt-4o',
    };
  }

  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
    const data: HealthStatus = await res.json();
    if (!data.hasApiKey && USE_MOCK_FALLBACK) {
      return {
        status: 'ok',
        hasApiKey: false,
        provider: 'mock',
        model: 'mock-gpt-4o',
      };
    }
    return data;
  } catch (err: any) {
    if (USE_MOCK_FALLBACK) {
      return {
        status: 'ok',
        hasApiKey: false,
        provider: 'mock',
        model: 'mock-gpt-4o',
      };
    }
    return {
      status: 'error',
      hasApiKey: false,
      provider: 'openai',
      model: 'unknown',
      error: err?.message || 'Failed to connect to backend server',
    };
  }
}

export interface StreamChatParams {
  messages: ChatMessage[];
  provider?: string;
  onChunk: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

/**
 * Simulates SSE streaming from local mock data for offline testing and demos.
 */
export async function streamMockCompletion({
  messages,
  onChunk,
  onDone,
  signal,
}: StreamChatParams): Promise<void> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const mockResponse = getMockResponseForPrompt(lastUserMsg);

  // Split response into realistic streaming chunks
  const chunkSize = 8;
  for (let i = 0; i < mockResponse.length; i += chunkSize) {
    if (signal?.aborted) return;
    const chunk = mockResponse.slice(i, i + chunkSize);
    onChunk(chunk);
    await new Promise((resolve) => setTimeout(resolve, 35));
  }

  onDone();
}

/**
 * Real-time SSE streaming from Bun backend /api/chat powered by OpenAI & OpenUI.
 * Automatically falls back to mock mode if backend is unavailable or unconfigured.
 */
export async function streamChatCompletion(params: StreamChatParams): Promise<void> {
  if (FORCE_MOCK_MODE) {
    return streamMockCompletion(params);
  }

  const { messages, provider = 'openai', onChunk, onError, onDone, signal } = params;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, provider }),
      signal,
    });

    if (!response.ok) {
      if (USE_MOCK_FALLBACK) {
        console.warn(
          `[OpenUI Gateway] Backend returned status ${response.status}. Automatically falling back to mock generator.`
        );
        return streamMockCompletion(params);
      }
      const errorJson = await response.json().catch(() => null);
      const errorMessage =
        errorJson?.error || `Request failed with status ${response.status} (${response.statusText})`;
      onError(errorMessage);
      return;
    }

    if (!response.body) {
      if (USE_MOCK_FALLBACK) {
        return streamMockCompletion(params);
      }
      onError('Response body is empty');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            if (USE_MOCK_FALLBACK) {
              console.warn('[OpenUI Gateway] Stream error. Falling back to mock generator.');
              return streamMockCompletion(params);
            }
            onError(parsed.error);
            return;
          }
          if (typeof parsed.text === 'string') {
            onChunk(parsed.text);
          }
        } catch {
          onChunk(dataStr);
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      onDone();
      return;
    }
    if (USE_MOCK_FALLBACK) {
      console.warn(
        `[OpenUI Gateway] Unable to reach backend server (${err?.message}). Automatically falling back to mock generator.`
      );
      return streamMockCompletion(params);
    }
    onError(err?.message || 'An unexpected error occurred while streaming');
  }
}
