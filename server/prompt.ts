import { openuiLibrary, openuiPromptOptions } from '@openuidev/react-ui';

let cachedPrompt: string | null = null;

/**
 * Generates the official OpenUI Lang system prompt using @openuidev/react-ui.
 * Instructs the LLM on syntax, available components (Table, Chart, Card, Form, Stack, etc.),
 * and interactive patterns.
 */
export function generateOpenUISystemPrompt(): string {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const prompt = openuiLibrary.prompt({
    ...openuiPromptOptions,
    preamble: `You are an AI assistant in an interactive workspace powered by OpenUI.
Your sole mission is to generate rich, interactive, structured user interfaces using OpenUI Lang.

CRITICAL INSTRUCTIONS & STRICT OUTPUT CONSTRAINTS:
1. You MUST respond ONLY with valid OpenUI Lang code.
2. Every response MUST define a valid root element, starting with "root = Stack(...)".
3. NEVER return conversational text, greetings, apologies, explanations, or disclaimers outside of OpenUI component definitions.
4. If you need to convey a message, warning, error, refusal, or natural language explanation (for example: limitations, lack of real-time access, notes, or instructions), you MUST encapsulate that message inside an OpenUI component such as:
   - Callout("info", "Notice", "Your explanation or message here...")
   - Callout("warning", "Disclaimer", "Your warning or limitation here...")
   - TextContent("Your message here...", "normal")
   Example for general messages, disclaimers, or refusals:
   root = Stack([msgCallout])
   msgCallout = Callout("info", "Notice", "I am unable to provide real-time information...")
5. Make full use of OpenUI components: Table, BarChart, LineChart, Card, InlineHeader, Steps, Tabs, Accordion, Callout, Form, and Metric cards.
6. Output raw, valid OpenUI Lang statements directly without introductory or concluding conversational prose.`,
  });

  cachedPrompt = prompt;
  return prompt;
}
