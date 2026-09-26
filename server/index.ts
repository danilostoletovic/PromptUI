import { getProvider } from './providers';
import { generateOpenUISystemPrompt } from './prompt';
import type { ChatMessage } from './providers/types';
import OpenAI from 'openai';
import { requestKey, validModel, connectionError } from './connection';

const PORT = Number(process.env.PORT) || 3001;

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Common CORS headers for local development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === '/api/health' && req.method === 'GET') {
      const hasApiKey = Boolean(requestKey(req));
      return Response.json(
        {
          status: 'ok',
          hasApiKey,
          provider: 'openai',
          model: process.env.OPENAI_MODEL || 'gpt-4o',
        },
        { headers: corsHeaders }
      );
    }

    if (url.pathname === '/api/connection' && req.method === 'POST') {
      try {
        const body = await req.json();
        const key = requestKey(req);
        if (!key || !validModel(body?.model)) return Response.json({ error: 'Enter an API key and a valid model name.' }, { status: 400, headers: corsHeaders });
        const client = new OpenAI({ apiKey: key, timeout: 15000, maxRetries: 0 });
        await client.models.retrieve(body.model, { signal: req.signal });
        return Response.json({ connected: true }, { headers: corsHeaders });
      } catch (error) {
        return Response.json({ error: connectionError(error) }, { status: 400, headers: corsHeaders });
      }
    }

    // Chat completion streaming endpoint (Real OpenAI Integration)
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      try {
        const body = (await req.json()) as {
          messages?: ChatMessage[];
          provider?: string;
          model?: string;
        };

        const { messages, provider: providerId = 'openai' } = body;

        if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100 ||
          messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') ||
          messages.reduce((size, m) => size + m.content.length, 0) > 200000) {
          return new Response(JSON.stringify({ error: 'Messages array is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (body.model !== undefined && !validModel(body.model)) return Response.json({ error: 'Invalid model name.' }, { status: 400, headers: corsHeaders });
        if (!requestKey(req)) {
          return new Response(
            JSON.stringify({
              error:
                'OPENAI_API_KEY is not configured on the server. Please verify your .env file.',
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }

        const provider = getProvider(providerId, requestKey(req));
        const systemPrompt = generateOpenUISystemPrompt();

        const abort = new AbortController();
        req.signal.addEventListener('abort', () => abort.abort(), { once: true });
        const stream = provider.streamChat(messages, { systemPrompt, signal: abort.signal, model: body.model });

        const readable = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of stream) {
                if (abort.signal.aborted) return;
                const sseMessage = `data: ${JSON.stringify({ text: chunk })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (streamError: any) {
              if (abort.signal.aborted) return;
              const errPayload = `data: ${JSON.stringify({
                error: connectionError(streamError),
              })}\n\n`;
              controller.enqueue(encoder.encode(errPayload));
              controller.close();
            }
          },
          cancel() { abort.abort(); },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...corsHeaders,
          },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            error: err?.message || 'Internal server error while processing chat.',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
});

console.log(`[OpenUI Gateway] Bun server listening on http://localhost:${PORT}`);

const shutdown = () => {
  try {
    server.stop(true);
  } catch {
    // Ignore error if already stopped
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

