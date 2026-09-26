import type { AIProvider } from './types';
import { OpenAIProvider } from './openai';

export * from './types';
export * from './openai';

export type SupportedProvider = 'openai';

/**
 * Provider factory for modular multi-model gateway.
 * Add Claude, Gemini, etc. here in future iterations.
 */
export function getProvider(providerId: string = 'openai', apiKey?: string): AIProvider {
  switch (providerId.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    default:
      throw new Error(`Unsupported AI Provider: "${providerId}". Currently supported: "openai"`);
  }
}
