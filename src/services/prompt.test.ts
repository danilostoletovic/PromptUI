import { afterEach, expect, test } from 'bun:test';
import { getMockResponseForPrompt } from './mockData';
import { parseCSV } from './offlineData';
import { detectOpenUI } from '../utils/openuiDetector';
import { streamChatCompletion } from './api';
import { createParser } from '@openuidev/react-lang';
import { openuiLibrary } from '@openuidev/react-ui';
import { PROMPT_EXAMPLES } from './promptExamples';

test('offline responses parse against the installed component library', () => {
  const parser = createParser(openuiLibrary.toJSONSchema());
  for (const prompt of [...PROMPT_EXAMPLES.map(p => p.prompt), 'Compare three laptops in a table.', 'Create a 7-day travel itinerary.', 'Explain recursion with an interactive example.', 'Create a simple project dashboard.', 'Make a workout plan.']) {
    const result = parser.parse(getMockResponseForPrompt(prompt));
    expect(result.root).not.toBeNull();
    expect(result.meta.errors).toEqual([]);
    expect(result.meta.unresolved).toEqual([]);
  }
});

test('unrelated prompts never silently receive a laptop or Tokyo template', () => {
  for (const prompt of ['Compare cats and dogs', 'Plan my work day', 'Write a birthday poem', 'Create a fitness app']) {
    const result = getMockResponseForPrompt(prompt);
    expect(result).not.toContain('MacBook');
    expect(result).not.toContain('Tokyo');
    expect(result).toContain(JSON.stringify(prompt));
    expect(result).toContain('Offline demo');
  }
});
test('CSV preserves quoted values and rejects malformed rows', () => {
  expect(parseCSV('Show CSV:\nName,Note\n"Doe, Jane","Said ""hello"""')).toEqual([
    ['Name', 'Note'], ['Doe, Jane', 'Said "hello"'],
  ]);
  expect(parseCSV('A,B\n1,2,3')).toBeNull();
  expect(parseCSV('A,B\n"unfinished,2')).toBeNull();
  expect(getMockResponseForPrompt('CSV:\nCity,Count\nBudapest,12')).toContain('Budapest');
});
test('plain text starting with r and mentions of root are not DSL', () => {
  expect(detectOpenUI('read this carefully', true).isOpenUI).toBe(false);
  expect(detectOpenUI('The variable root = 4 is a number').isOpenUI).toBe(false);
  expect(detectOpenUI('root = Stack([])').isOpenUI).toBe(true);
  expect(detectOpenUI('```openui\nroot = Stack([])\n```').classification).toBe('fenced-openui');
});
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
async function runStream(parts: string[]) {
  globalThis.fetch = (async () => new Response(new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
      controller.close();
    },
  }))) as unknown as typeof fetch;
  let text = '', error = '', done = 0;
  await streamChatCompletion({ messages: [{ role: 'user', content: 'test' }],
    onChunk: chunk => { text += chunk; }, onError: e => { error = e; }, onDone: () => { done++; },
  });
  return { text, error, done };
}
test('SSE handles fragmented frames, CRLF, and final unterminated DONE', async () => {
  expect(await runStream(['data:{"te', 'xt":"hello"}\r', '\n\r\ndata: [DONE]'])).toEqual({ text: 'hello', error: '', done: 1 });
});
test('stream errors preserve partial output without appending demo content', async () => {
  const result = await runStream(['data: {"text":"partial"}\n\n', 'data: {"error":"Rate limit"}\n\n']);
  expect(result).toEqual({ text: 'partial', error: 'Rate limit', done: 0 });
});
test('truncated streams are reported instead of marked complete', async () => {
  const result = await runStream(['data: {"text":"partial"}\n\n']);
  expect(result.done).toBe(0);
  expect(result.error).toContain('interrupted');
});
