import { getProvider } from './providers';
import { generateOpenUISystemPrompt } from './prompt';
import type { ChatMessage } from './providers/types';

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
      const hasApiKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');
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

    // Chat completion streaming endpoint (Real OpenAI Integration)
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      try {
        const body = (await req.json()) as {
          messages?: ChatMessage[];
          provider?: string;
        };

        const { messages, provider: providerId = 'openai' } = body;

        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response(JSON.stringify({ error: 'Messages array is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
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

        const provider = getProvider(providerId);
        const systemPrompt = generateOpenUISystemPrompt();

        const stream = provider.streamChat(messages, { systemPrompt });

        const readable = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of stream) {
                const sseMessage = `data: ${JSON.stringify({ text: chunk })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (streamError: any) {
              const errPayload = `data: ${JSON.stringify({
                error: streamError?.message || 'Streaming generation failed.',
              })}\n\n`;
              controller.enqueue(encoder.encode(errPayload));
              controller.close();
            }
          },
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

