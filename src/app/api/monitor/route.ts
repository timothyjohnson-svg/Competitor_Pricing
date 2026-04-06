import { runMonitor } from '@/lib/pricing/agent';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 300; // 5 min — Vercel Pro/Enterprise; use 60 for hobby

export async function POST() {
  // Defense-in-depth: explicitly require auth even though middleware covers all routes.
  // This route triggers expensive Anthropic + Firecrawl calls on every invocation.
  await auth.protect();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runMonitor(undefined, (event) => {
          send({ type: 'progress', message: event });
        });

        send({ type: 'complete', result });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
