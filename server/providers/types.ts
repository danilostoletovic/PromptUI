export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  signal?: AbortSignal;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
}

/**
 * Modular AI Provider Interface
 * Allows seamless extension to Anthropic Claude, Google Gemini,
 * or custom local models without altering the frontend or gateway API contracts.
 */
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  streamChat(messages: ChatMessage[], options?: StreamChatOptions): AsyncIterable<string>;
}
