export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface SessionItem {
  id: string;
  prompt: string;
  response: string;
  timestamp: number;
  provider: string;
  model: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  hasApiKey: boolean;
  provider: string;
  model: string;
  error?: string;
}

export type ViewMode = 'ui' | 'code';
export type FallbackViewMode = 'text' | 'card' | 'raw';
