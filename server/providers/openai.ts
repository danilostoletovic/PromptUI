import OpenAI from 'openai';
import type { AIProvider, ChatMessage, StreamChatOptions } from './types';

export class OpenAIProvider implements AIProvider {
  public readonly id = 'openai';
  public readonly name = 'OpenAI';
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not configured. Please set it in your .env file.'
      );
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: StreamChatOptions
  ): AsyncIterable<string> {
    const model = options?.model || process.env.OPENAI_MODEL || 'gpt-4o';

    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options?.systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const stream = await this.client.chat.completions.create({
      model,
      messages: formattedMessages,
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
      stream: true,
    }, { signal: options?.signal });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
